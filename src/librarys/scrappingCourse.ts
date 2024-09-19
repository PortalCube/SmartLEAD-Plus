import { fetchDocument } from "../scripts/util.ts";
import {
    getActivityScheduleList,
    getCourseDetail,
    getCourseList,
    isMoodleError,
} from "../scripts/api.ts";
import {
    MoodleCourse,
    MoodleCourseType,
    convertResponseToCourse,
} from "./course.ts";
import { MoodleSection, convertResponseToSections } from "./section.ts";
import {
    MoodleActivity,
    MoodleActivityType,
    convertActivityType,
    convertResponseToActivitys,
} from "./activity.ts";
import dayjs from "dayjs";
import { unescape } from "lodash";

export async function scrapData(token: string, userId: number) {
    console.time("scrapData");
    console.count("scrapData API Call");
    const courseResponse = await getCourseList(token);
    if (isMoodleError(courseResponse)) {
        return;
    }

    const courses = courseResponse.map((course) =>
        convertResponseToCourse(course)
    );

    const sections: MoodleSection[] = [];
    const activitys: MoodleActivity[] = [];

    // 코스가 없음
    if (courses.length === 0) {
        return;
    }

    console.count("scrapData API Call");
    await scrapCourseListDetail(courses);

    try {
        // courses 배열을 복사
        const remainingCourses = courses.slice(0);
        while (remainingCourses.length > 0) {
            // 3개씩 끊어서 API 호출
            const promises = remainingCourses.splice(0, 3);

            await Promise.all(
                promises.map((course) =>
                    scrapCourse(course, sections, activitys, token, userId)
                )
            );

            console.log("남은 코스: ", remainingCourses.length);
        }
    } catch (e) {
        console.error(
            "Moodle 데이터를 불러오는 과정에서 오류가 발생했습니다.",
            e
        );
        return {
            courses: [],
            sections: [],
            activitys: [],
        };
    }

    if (activitys.length > 0) {
        try {
            console.count("scrapData API Call");
            await scrapActivitySchedule(token, activitys);
            fixActivitySchedule(courses, sections, activitys);
            renameActivity(activitys);
        } catch (e) {
            console.error(e);
        }
    }

    console.log("코스: ", courses);
    console.log("섹션: ", sections);
    console.log("활동: ", activitys);

    console.timeEnd("scrapData");

    return { courses, sections, activitys };
}

async function scrapCourse(
    course: MoodleCourse,
    sections: MoodleSection[],
    activitys: MoodleActivity[],
    token: string,
    userId: number
) {
    console.time(`scrapData-course ${course.id}`);
    console.count("scrapData API Call");
    const courseDetailResponse = await getCourseDetail(course.id, token);
    if (isMoodleError(courseDetailResponse)) {
        return;
    }

    sections.push(...convertResponseToSections(courseDetailResponse, course));

    const courseActivitys = convertResponseToActivitys(
        courseDetailResponse,
        course.id
    );

    activitys.push(...courseActivitys);

    // 과제, 퀴즈, 설문조사가 있을때만 불러오기
    const types = [
        MoodleActivityType.Assignment,
        MoodleActivityType.Quiz,
        MoodleActivityType.Survey,
    ];

    if (
        courseActivitys.filter((item) => types.includes(item.type)).length > 0
    ) {
        try {
            console.count("scrapData API Call");
            await scrapActivityProgress(userId, course.id, activitys);
        } catch (e) {
            console.error(e);
        }
    }

    // 비디오 활동이 있을때만 불러오기
    if (
        courseActivitys.filter((item) => item.type === MoodleActivityType.Video)
            .length > 0
    ) {
        try {
            console.count("scrapData API Call");
            await scrapVideoProgress(course.id, activitys);
        } catch (e) {
            console.error(e);
        }
    }

    console.timeEnd(`scrapData-course ${course.id}`);
}

async function scrapCourseListDetail(courses: MoodleCourse[]) {
    const document = await fetchDocument("/dashboard.php");

    const courseElements = document.querySelectorAll<HTMLLIElement>(
        ".course_lists > .my-course-lists > li"
    );

    for (const courseElement of courseElements) {
        const id =
            courseElement
                .querySelector(".course-link")
                ?.getAttribute("href")
                ?.split("=")[1] ?? "";
        const image =
            courseElement
                .querySelector(".course-image > img")
                ?.getAttribute("src") ?? "";
        const owner = courseElement.querySelector(".prof")?.textContent ?? "";

        const find = courses.find((course) => course.id === Number(id));

        if (find === undefined) {
            continue;
        }

        find.ownerName = owner;
        find.imageUrl = image;
    }
}

function getActivityProgress(element: HTMLUListElement) {
    const summaryTable = element.querySelector(".submissionsummarytable");

    if (summaryTable === null) {
        return null;
    }

    // 제출 여부
    const hasSubmission =
        summaryTable.querySelector(".submissionstatussubmitted") !== null;

    // 기한 내 제출
    const isEarlySubmission =
        summaryTable.querySelector(".earlysubmission") !== null;

    // 채점 여부
    const isGraded = summaryTable.querySelector(".submissiongraded") !== null;

    return hasSubmission;
}

function getQuizProgress(element: HTMLUListElement) {
    const textNodes = Array.from(element.childNodes)
        .map((item) => item.textContent)
        .filter((item) => item);

    // TODO: 다국어 locale 지원
    // 미제출 메세지 체크
    const notSubmitted = textNodes.includes(
        "해당 퀴즈에 응시한 내역이 없습니다."
    );

    return notSubmitted === false;
}

function getSurveyProgress(element: HTMLUListElement) {
    const textContent = element.textContent;

    return textContent?.startsWith("Completed on") === true;
}

export async function scrapActivityProgress(
    userId: number,
    courseId: number,
    activitys: MoodleActivity[]
) {
    const document = await fetchDocument(
        `/report/outline/user.php?id=${userId}&course=${courseId}&mode=complete`
    );

    const errorElement = document.querySelector(".errormessage");

    if (errorElement !== null) {
        return;
    }

    const elements = Array.from(
        document.querySelectorAll(".section > .content > h4")
    );

    for (const element of elements) {
        const anchorElement = element.querySelector("a")!;
        const url = anchorElement.getAttribute("href")!;
        const id = Number(url.split("=")[1]);
        const type = convertActivityType(url.split("/")[4]);

        const siblingElement = element.nextElementSibling as HTMLUListElement;

        if (
            siblingElement === null ||
            siblingElement.tagName.toLowerCase() !== "ul"
        ) {
            continue;
        }

        let progress = null;

        if (type === MoodleActivityType.Assignment) {
            // 과제 확인
            progress = getActivityProgress(siblingElement);
        } else if (type === MoodleActivityType.Quiz) {
            // 퀴즈 확인
            progress = getQuizProgress(siblingElement);
        } else if (type === MoodleActivityType.Survey) {
            // 설문조사 확인
            progress = getSurveyProgress(siblingElement);
        }

        if (progress === null) {
            continue;
        }

        const find = activitys.find((item) => item.id === id);

        if (find === undefined) {
            continue;
        }

        find.progress = progress ? 1.0 : 0.0;
    }
}

export async function scrapVideoProgress(
    courseId: number,
    activitys: MoodleActivity[]
) {
    let document = await fetchDocument(
        "/report/ubcompletion/user_progress_a.php?id=" + courseId
    );

    let errorElement = document.querySelector(".alert-danger");

    // 온라인 출석부를 사용하지 않음
    if (errorElement) {
        document = await fetchDocument(
            "/report/ubcompletion/user_progress.php?id=" + courseId
        );

        errorElement = document.querySelector(".alert-danger");

        if (errorElement) {
            // 강의에 동영상 활동이 없음
            return;
        }

        return Array.from(
            document.querySelectorAll<HTMLTableRowElement>(
                ".user_progress tbody:not(.empty) tr"
            )
        ).forEach((node) => getActivityAlternative(node, activitys));
    }

    return Array.from(
        document.querySelectorAll<HTMLTableRowElement>(
            ".user_progress_table tbody:not(.empty) tr"
        )
    ).forEach((node) => getActivity(node, activitys));
}

function getTime(timeText: string) {
    const arr = timeText.split(":").map((item) => Number(item));

    if (arr.length <= 1) {
        return 0;
    } else if (arr.length === 2) {
        return arr[0] * 60 + arr[1];
    } else if (arr.length === 3) {
        return arr[0] * 60 * 60 + arr[1] * 60 + arr[2];
    } else {
        return 0;
    }
}

function getActivity(node: HTMLTableRowElement, activitys: MoodleActivity[]) {
    const cellElements = node.querySelectorAll("td");
    const cellCount = cellElements.length;

    const attendanceElement = cellElements[cellCount === 6 ? 4 : 3];
    const playTimeElement = cellElements[cellCount === 6 ? 3 : 2];
    const requirementElement = cellElements[cellCount === 6 ? 2 : 1];
    const buttonElement = playTimeElement.querySelector("button");

    const requirement = getTime(requirementElement.textContent?.trim() ?? "0");
    const playTime = getTime(
        playTimeElement.childNodes[0].textContent?.trim() ?? "0"
    );
    const attendance = attendanceElement.textContent?.trim() === "O";
    const modId = Number(buttonElement?.getAttribute("data-modid") ?? -1);
    const progress = Math.min(playTime / requirement, 1.0);

    const find = activitys.find((item) => item.modId === modId);

    if (find === undefined) {
        return;
    }

    find.progress = attendance ? 1.0 : progress;
}

function getActivityAlternative(
    node: HTMLTableRowElement,
    activitys: MoodleActivity[]
) {
    const cellElements = node.querySelectorAll("td");
    const cellCount = cellElements.length;

    const playTimeElement = cellElements[cellCount === 5 ? 3 : 2];
    const requirementElement = cellElements[cellCount === 5 ? 2 : 1];
    const buttonElement = playTimeElement.querySelector("button");

    const requirement = getTime(requirementElement.textContent?.trim() ?? "0");
    const playTime = getTime(
        playTimeElement.childNodes?.[0]?.textContent?.trim() ?? "0"
    );
    const modId = Number(buttonElement?.getAttribute("data-modid") ?? -1);
    const progress = Math.min(playTime / requirement, 1.0);

    const find = activitys.find((item) => item.modId === modId);

    if (find === undefined) {
        return;
    }

    find.progress = progress;
}

export async function scrapActivitySchedule(
    token: string,
    activitys: MoodleActivity[]
) {
    const response = await getActivityScheduleList(
        1577804400, // 2020-01-01
        9999, // 2047-05-18
        token
    );
    if (isMoodleError(response)) {
        return;
    }

    for (const item of response.events) {
        const id = Number(item.url.split("=")[1] ?? -1);
        const find = activitys.find((activity) => activity.id === id);

        if (find === undefined) {
            continue;
        }

        find.startDate = item.timestart;
        find.endDate = item.timestart + item.timeduration;
    }
}

// scrapActivitySchedule API의 반환 결과에서 일부 영상의 종료 시간이 1년 전으로 표기되는 경우를 확인
// (아마도 해당 강의가 지난 학기의 영상을 재활용 하는 경우로 추측됨)
// 이 함수는 활동이 코스의 기간을 벗어난 경우, 해당 활동이 속한 section의 기간으로 수정하여 문제를 '임시적으로' 해결함
function fixActivitySchedule(
    courses: MoodleCourse[],
    sections: MoodleSection[],
    activitys: MoodleActivity[]
) {
    for (const activity of activitys) {
        const course = courses.find(
            (course) => course.id === activity.courseId
        );

        if (course === undefined || course.type === MoodleCourseType.User) {
            continue;
        }

        if (activity.startDate === null || activity.endDate === null) {
            continue;
        }

        const courseStartDate = dayjs(course.startDate * 1000);
        const courseEndDate = dayjs(course.endDate * 1000);

        const activityStartDate = dayjs(activity.startDate * 1000);
        const activityEndDate = dayjs(activity.endDate * 1000);

        if (
            activityStartDate.isBefore(courseStartDate) === false &&
            activityEndDate.isAfter(courseEndDate) === false
        ) {
            // 이상 없는 활동. skip
            continue;
        }

        // 활동이 코스 기간을 벗어난 경우 -> activity가 속한 section의 기간으로 지정
        const section = sections.find(
            (section) => section.id === activity.sectionId
        );

        if (section === undefined) {
            continue;
        }

        const newStartDate = section?.startDate ?? activity.startDate;
        const newEndDate = section?.endDate ?? activity.endDate;

        console.warn(
            [
                `경고: ${activity.name}의 기간이 코스 범위를 벗어남에 따라 수정되었습니다.`,
                `기존: ${dayjs(activity.startDate * 1000).format()} ~ ${dayjs(activity.endDate * 1000).format()}`,
                `변경: ${newStartDate ? dayjs(newStartDate * 1000).format() : null} ~ ${newEndDate ? dayjs(newEndDate * 1000).format() : null}`,
            ].join("\n")
        );

        activity.startDate = newStartDate;
        activity.endDate = newEndDate;
    }
}

// Activity 이름이 URL 인코딩 된 경우 수정
function renameActivity(activitys: MoodleActivity[]) {
    for (const activity of activitys) {
        activity.name = unescape(activity.name);
    }
}
