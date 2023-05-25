"use strict";
import {
    GetDOMPage,
    GetWeekDate,
    Section,
    AttendanceStatus,
    Activity,
    ActivityType,
    DurationToSecond,
    Course,
    Period
} from "./util";
import dayjs from "dayjs";

const _latestRefresh: string | null = null;
const courses: Course[] = [];

export const CourseManager = {
    _refreshing: false,
    _latestRefresh,

    courses,

    get activitys() {
        // map & flat hell
        const activitys = this.courses
            .map((course) =>
                course.sections
                    .map((section) =>
                        section.activitys.map((activity) => ({
                            course_id: course.id,
                            section_id: section.id,
                            ...activity
                        }))
                    )
                    .flat()
            )
            .flat();
        return activitys;
    },

    async SaveStorage() {
        await chrome.storage.local.set({
            courses: this.courses,
            latestRefresh: dayjs().format()
        });
    },

    async LoadStorage() {
        const storage = await chrome.storage.local.get(["courses", "latestRefresh"]);
        this._latestRefresh = storage.latestRefresh ?? null;
        this.courses = storage.courses;
    },

    async LoadData() {
        const now = dayjs();
        await this.LoadStorage();

        if (!this._latestRefresh || now.diff(this._latestRefresh, "minute") > 5) {
            await this.Refresh();
        }
    },

    async AuthCheck() {
        const document = await GetDOMPage("/local/ruauth/");

        // todo: add check logic

        return false;
    },

    Correction() {
        // 후처리 과정 :: 누락된 date들 추가

        // 1주차 날짜
        const date: Period = { start_date: null, end_date: null };

        // date 구하기 :: 확실하게 날짜를 구할 수 있는 방법이 없어서
        // 긁어온 데이터에서 날짜를 구하려고 시도
        (() => {
            for (const course of this.courses) {
                if (!course.isRegular) {
                    continue;
                }
                for (const section of course.sections) {
                    if (
                        section.date.start_date !== null ||
                        section.date.end_date !== null
                    ) {
                        const startDate = dayjs(section.date.start_date);
                        const endDate = dayjs(section.date.end_date);
                        date.start_date = startDate
                            .subtract({ week: section.id - 1 })
                            .format();
                        date.end_date = endDate
                            .subtract({ week: section.id - 1 })
                            .format();
                        return;
                    }
                }
            }
        })();

        if (!date.start_date) {
            console.error(
                "Correction: 보정에 실패했습니다. date 기준점을 잡을 수 없습니다."
            );
            return;
        }

        this.courses.forEach((course) => {
            if (!course.isRegular) {
                // 비교과는 날짜 제한이 없음
                return;
            }
            course.sections.forEach((section) => {
                if (section.date.start_date === null) {
                    const startDate = dayjs(date.start_date);
                    const endDate = dayjs(date.end_date);

                    section.date.start_date = startDate
                        .add({ week: section.id - 1 })
                        .format();
                    section.date.end_date = endDate
                        .add({ week: section.id - 1 })
                        .format();
                }

                // 종료 일자가 없는 활동의 종료 일자 설정 -- 일단 보류
                // section.activitys.forEach((activity) => {
                //     if (activity.date.end_date === null) {

                //         // 1. 이번 주차의 끝으로 설정
                //         activity.date.end_date = section.date.end_date;

                //         // 2. 이번 학기의 끝으로 설정
                //         activity.date.end_date = dayjs(firstSectionDate.end_date)
                //             .add({ week: 14 })
                //             .format();
                //     }
                // });
            });
        });
    },

    async Refresh() {
        if (this._refreshing) {
            return;
        }
        this._refreshing = true;
        const document = await GetDOMPage("/");
        const requireAuth = await this.AuthCheck();
        const elements = Array.from(
            document.querySelectorAll<HTMLLIElement>(".my-course-lists > li")
        );
        const promises = [];

        for (const element of elements) {
            const id = element
                .querySelector(".course_link")
                ?.getAttribute("href")
                ?.split("?id=")[1];
            const name =
                element.querySelector(".course-title > h3")?.firstChild?.textContent ??
                "";
            const type = element.classList[0];

            if (type === "course_label_re_01" && requireAuth) {
                console.warn(name, "교과목은 인증이 필요합니다. 스킵합니다.");
                continue;
            }

            if (id) {
                promises.push(this.RefreshCourse(parseInt(id), name));
            }
        }

        // 요청 기다리기
        await Promise.all(promises);

        // date 보정
        this.Correction();

        // 저장하기
        await this.SaveStorage();

        this._refreshing = false;
    },

    async RefreshCourse(id: number, name: String) {
        const course = await this.RefreshCourseInfo(id);

        if (!course) {
            console.error(name, "교과목은 인증이 필요합니다.");
            return;
        }

        const find = this.courses.find((item) => item.id === id);

        if (find) {
            find.name = course.name;
            find.owner = course.owner;
            find.isRegular = course.isRegular;
            find.sections = course.sections;
        } else {
            this.courses.push(course);
        }

        const promises = [
            this.RefreshCourseVideo(id),
            this.RefreshCourseAssignment(id),
            this.RefreshCourseZoom(id),
            this.RefreshCourseQuiz(id)
        ];

        await Promise.all(promises);
    },

    async RefreshCourseInfo(id: number) {
        const document = await GetDOMPage("/course/view.php?id=" + id);
        const $ = document.querySelector.bind(document);
        const $$ = document.querySelectorAll.bind(document);

        const authRequireElement = $("form#myForm");

        if (
            authRequireElement &&
            authRequireElement.getAttribute("action") === "/local/ruauth/"
        ) {
            return null;
        }

        const name = $(".coursename > h1 > a")?.textContent ?? "";
        const owner = $(".media-heading")?.textContent?.trim() ?? "";
        const isRegular = $<HTMLAnchorElement>(".submenu-syllabus") !== null;

        const attendanceNodes = $$<HTMLLIElement>(".attendance > li");
        const sectionNodes = $$<HTMLLIElement>(".total_sections ul li.section");

        const course: Course = {
            id,
            name,
            owner,
            isRegular,
            sections: []
        };

        console.log(attendanceNodes);

        // 각 섹션 긁어오기
        sectionNodes.forEach((sectionNode) => {
            const sectionId = sectionNode.getAttribute("id")?.split("-")[1];
            const sectionName = sectionNode.getAttribute("aria-label")?.trim() || "";
            const activityNodes = sectionNode.querySelectorAll<HTMLLIElement>(
                ".total_sections .activity:not(.label)"
            );

            if (!sectionId) {
                console.warn("RefreshCourseInfo: 섹션 id를 찾는데 실패했습니다.");
                return;
            }

            const section: Section = {
                id: parseInt(sectionId),
                name: sectionName,
                date: {
                    start_date: null,
                    end_date: null
                },
                activitys: [],
                status: AttendanceStatus.None
            };

            if (isRegular) {
                const regexpResult = GetWeekDate(sectionName);

                if (regexpResult) {
                    section.date.start_date = regexpResult.start_date;
                    section.date.end_date = regexpResult.end_date;
                }
            }

            activityNodes.forEach((activityNode) => {
                if (activityNode.querySelector(".dimmed")) {
                    return;
                }

                const activityId = activityNode.getAttribute("id")?.split("-")[1];
                const activityName =
                    activityNode
                        .querySelector<HTMLSpanElement>(".instancename")
                        ?.firstChild?.textContent?.trim() ?? "";

                if (!activityId) {
                    return;
                }

                const activity: Activity = {
                    id: parseInt(activityId),
                    name: activityName,
                    type: ActivityType.Unknown,
                    complete: false,
                    date: {
                        start_date: null,
                        end_date: null
                    }
                };

                if (activityNode.classList.contains("vod")) {
                    activity.type = ActivityType.Video;

                    activity.video = {
                        length: 0,
                        require: null,
                        watched: null
                    };

                    const activityTime = activityNode
                        .querySelector(".text-ubstrap")
                        ?.firstChild?.textContent?.trim()
                        .split(" ~ ");

                    if (activityTime) {
                        activity.date.start_date = dayjs(activityTime[0]).format();
                        activity.date.end_date = dayjs(activityTime[1]).format();
                    }

                    const videoTime = activityNode
                        .querySelector(".text-info")
                        ?.textContent?.replace(", ", "");

                    if (videoTime) {
                        activity.video.length = DurationToSecond(videoTime);
                    }
                } else if (activityNode.classList.contains("zoom")) {
                    activity.type = ActivityType.Zoom;
                } else if (activityNode.classList.contains("assign")) {
                    activity.type = ActivityType.Assignment;
                } else if (activityNode.classList.contains("quiz")) {
                    activity.type = ActivityType.Quiz;
                }

                section.activitys.push(activity);
            });

            course.sections.push(section);
        });

        // 출결 정보 체크
        attendanceNodes.forEach((node) => {
            let section: Section | undefined;
            const element = node.querySelector(".sname");

            if (!element) {
                console.warn(
                    `RefreshCourseInfo: ${id} 강의실의 출결 정보에 Element가 없습니다.`
                );
                return;
            }

            const sectionId = element.getAttribute("data-target");

            if (!sectionId) {
                console.warn(
                    `RefreshCourseInfo: ${id} 강의실의 출결 정보에서 섹션 정보를 가져오지 못했습니다.`
                );

                return;
            }

            section = course.sections.find((item) => item.id === parseInt(sectionId));

            if (!section) {
                console.warn(
                    `RefreshCourseInfo: ${id} 강의실에서 ${sectionId} 섹션이 존재하지 않습니다.`
                );
                return;
            }

            if (node.classList.contains("name_text0")) {
                section.status = AttendanceStatus.Absence;
            } else if (node.classList.contains("name_text1")) {
                section.status = AttendanceStatus.Attend;
            } else if (node.classList.contains("name_text2")) {
                section.status = AttendanceStatus.Late;
            }
        });

        return course;
    },

    async RefreshCourseAssignment(id: number) {
        const course = this.courses.find((item) => item.id === id);

        if (!course) {
            return;
        }

        const document = await GetDOMPage("/mod/assign/index.php?id=" + id);
        const $$ = document.querySelectorAll.bind(document);

        let nodes = Array.from($$("table tbody:not(.empty) tr[class]"));

        for (let node of nodes) {
            let cells = node.querySelectorAll("td");

            const sectionName = cells[0].textContent?.trim();
            const section = course.sections.find((item) => item.name === sectionName);
            const activityId = cells[1]
                ?.querySelector("a")
                ?.getAttribute("href")
                ?.split("?id=")[1];
            const activityName = cells[1].textContent ?? "";
            const activityDate = cells[2] ? dayjs(cells[2].textContent) : null;
            const activityComplete = cells[3].textContent === "제출 완료";

            if (!activityId || !section) {
                continue;
            }

            let activity = section.activitys.find(
                (item) => item.id === parseInt(activityId)
            );

            if (!activity) {
                section.activitys.push({
                    id: parseInt(activityId),
                    name: activityName,
                    type: ActivityType.Assignment,
                    complete: activityComplete,
                    date: {
                        start_date: null,
                        end_date: activityDate?.format() ?? null
                    }
                });
            } else {
                activity.complete = activityComplete;
                activity.date.end_date = activityDate?.format() ?? null;
            }
        }
    },

    async RefreshCourseQuiz(id: number) {
        const course = this.courses.find((item) => item.id === id);

        if (!course) {
            return;
        }

        const document = await GetDOMPage("/mod/quiz/index.php?id=" + id);
        const $$ = document.querySelectorAll.bind(document);

        let nodes = Array.from($$("table tbody:not(.empty) tr[class]"));

        for (let node of nodes) {
            let cells = node.querySelectorAll("td");

            const sectionName = cells[0].textContent?.trim();
            const section = course.sections.find((item) => item.name === sectionName);
            const activityId = cells[1]
                ?.querySelector("a")
                ?.getAttribute("href")
                ?.split("?id=")[1];
            const activityName = cells[1].textContent ?? "";
            const activityDate = cells[2]?.textContent?.trim()
                ? dayjs(cells[2].textContent)
                : null;
            const activityComplete = activityDate ? activityDate < dayjs() : false;

            if (!activityId || !section) {
                console.warn(node);
                continue;
            }

            let activity = section.activitys.find(
                (item) => item.id === parseInt(activityId)
            );

            if (!activity) {
                activity = {
                    id: parseInt(activityId),
                    name: activityName,
                    type: ActivityType.Quiz,
                    complete: activityComplete,
                    date: {
                        start_date: null,
                        end_date: activityDate?.format() ?? null
                    }
                };
                section.activitys.push(activity);
            } else {
                activity.complete = activityComplete;
                activity.date.end_date = activityDate?.format() ?? null;
            }

            await this.RefreshCourseQuizInfo(parseInt(activityId));
        }
    },

    async RefreshCourseQuizInfo(id: number) {
        const document = await GetDOMPage("/mod/quiz/view.php?id=" + id);
        const $ = document.querySelector.bind(document);

        const courseURL = $(".breadcrumb > li:nth-child(3) a")?.getAttribute("href");

        if (!courseURL) {
            console.warn("RefreshCourseQuizInfo: Course URL을 찾지 못했습니다.");
            return;
        }

        const regexp = /\?id=(\d+)#section-(\d+)/g;
        const regexpResult = regexp.exec(courseURL);

        if (!regexpResult || regexpResult.length < 3) {
            console.warn(
                "RefreshCourseQuizInfo: Course URL에서 강의실 정보를 찾는데 실패했습니다."
            );
            return;
        }

        const courseId = parseInt(regexpResult[1]);
        const sectionId = parseInt(regexpResult[2]);
        const complete = $(".quizattemptsummary .statedetails") !== null;

        const course = this.courses.find((item) => item.id === courseId);

        if (!course) {
            console.warn(
                `RefreshCourseQuizInfo: ${courseId}를 ID로 갖는 강의를 찾지 못했습니다.`
            );
            return;
        }

        const section = course.sections.find((item) => item.id === sectionId);

        if (!section) {
            console.warn(
                `RefreshCourseQuizInfo: ${courseId} 강의실에서 ${sectionId}를 ID로 갖는 섹션을 찾지 못했습니다.`
            );
            return;
        }

        const activity = section.activitys.find((item) => item.id === id);

        if (!activity) {
            console.warn(
                `RefreshCourseQuizInfo: ${courseId} 강의실에서 ${id}를 ID로 갖는 활동을 찾지 못했습니다.`
            );
            return;
        }

        activity.complete = activity.complete || complete;
    },

    async RefreshCourseZoom(id: number) {
        const course = this.courses.find((item) => item.id === id);

        if (!course) {
            return;
        }

        const document = await GetDOMPage("/mod/zoom/index.php?id=" + id);
        const $$ = document.querySelectorAll.bind(document);

        let nodes = Array.from($$(".meeting-list tbody:not(.empty) tr"));

        for (let node of nodes) {
            let cells = node.querySelectorAll("td");

            const sectionName = cells[0].textContent?.trim();
            const section = course.sections.find((item) => item.name === sectionName);
            const activityDate = cells[2] ? dayjs(cells[2].textContent) : null;
            const activityId = cells[1]
                ?.querySelector("a")
                ?.getAttribute("href")
                ?.split("?id=")[1];

            if (!activityId || !section) {
                continue;
            }

            let activity = section.activitys.find(
                (item) => item.id === parseInt(activityId)
            );

            if (!activity) {
                section.activitys.push({
                    id: parseInt(activityId),
                    name: cells[1].textContent ?? "",
                    type: ActivityType.Zoom,
                    complete: activityDate ? dayjs() > activityDate : false,
                    date: {
                        start_date: null,
                        end_date: activityDate?.format() ?? null
                    }
                });
            } else {
                activity.complete = activityDate ? dayjs() > activityDate : false;
                activity.date.end_date = activityDate?.format() ?? null;
            }
        }
    },

    async RefreshCourseVideo(id: number) {
        const course = this.courses.find((item) => item.id === id);

        if (!course) {
            console.warn(
                `RefreshCourseVideo: 데이터에 ${id} 강의실이 존재하지 않습니다.`
            );
            return;
        }

        const document = await GetDOMPage(
            "/report/ubcompletion/user_progress_a.php?id=" + id
        );
        const $$ = document.querySelectorAll.bind(document);

        const nodes = Array.from($$(".user_progress_table tbody tr"));

        let section: Section | null = null;

        for (let node of nodes) {
            const cells = Array.from(node.querySelectorAll("td"));

            const sectionId =
                cells[0].getAttribute("rowspan") && cells[0].textContent
                    ? parseInt(cells[0].textContent)
                    : null;

            if (sectionId) {
                section = course.sections.find((item) => item.id === sectionId) ?? null;
                cells.shift();
            }

            if (cells[2]?.textContent?.trim() === "") {
                // 동영상 강의가 없음
                continue;
            }

            const activityName = cells[0].textContent?.trim();
            const activityVideoRequire = cells[1].textContent
                ? DurationToSecond(cells[1].textContent)
                : null;
            const activityVideoWatched = cells[2]?.firstChild?.textContent
                ? DurationToSecond(cells[2].firstChild.textContent)
                : null;
            const activityComplete = cells[3]?.textContent?.trim() === "O";

            if (!section) {
                console.warn(
                    `RefreshCourseVideo: 섹션을 찾을 수 없습니다. sectionId를 제대로 찾지 못했을 가능성이 있습니다.`
                );
                continue;
            }

            // 출석부 페이지는 명확한 id가 없기에 이름으로 검색
            let activity = section.activitys.find((item) => item.name === activityName);

            if (!activity) {
                console.warn(
                    `RefreshCourseVideo: ${id} 강의실에서 "${activityName}"을 이름으로 갖는 활동을 찾지 못했습니다.`
                );
                continue;
            }

            if (!activity.video) {
                activity.video = {
                    length: 0,
                    require: null,
                    watched: null
                };
            }

            activity.complete = activityComplete;
            activity.video.require = activityVideoRequire;
            activity.video.watched = activityVideoWatched;
        }
    }
};
