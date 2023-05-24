import {
    GetDOMPage,
    GetWeekDate,
    IsWeekText,
    Section,
    AttendanceStatus,
    Activity,
    ActivityType,
    DurationToSecond,
    Course
} from "./util";
import dayjs from "dayjs";

const data: Course[] = [];

export const CourseManager = {
    _refreshing: false,

    data,

    async Load() {},

    async AuthCheck() {
        const document = await GetDOMPage("/local/ruauth/");

        // todo: add check logic

        return false;
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
            const name = element.querySelector(".course-title > h3")?.textContent ?? "";
            const type = element.classList[0];

            if (type === "course_label_re_01" && requireAuth) {
                console.warn(name, "교과목은 인증이 필요합니다. 스킵합니다.");
                continue;
            }

            if (id) {
                promises.push(this.RefreshCourse(parseInt(id), name));
            }
        }

        await Promise.all(promises);
        this._refreshing = false;
    },

    async RefreshCourse(id: Number, name: String) {
        const course = await this.RefreshCourseInfo(id);

        if (!course) {
            console.error(name, "교과목은 인증이 필요합니다.");
            return;
        }

        const find = this.data.find((item) => item.id === id);

        if (find) {
            find.name = course.name;
            find.owner = course.owner;
            find.isRegular = course.isRegular;
            find.sections = course.sections;
        } else {
            this.data.push(course);
        }

        const promises = [this.RefreshCourseAssignment(id), this.RefreshCourseZoom(id)];

        await Promise.all(promises);
    },

    async RefreshCourseInfo(id: Number) {
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
        const sectionNodes = $$<HTMLLIElement>(".total_sections .weeks li.section");

        const course: Course = {
            id,
            name,
            owner,
            isRegular,
            sections: []
        };

        // 각 섹션 긁어오기
        sectionNodes.forEach((sectionNode, index) => {
            const sectionName = sectionNode.getAttribute("aria-label")?.trim() || "";
            const activityNodes = sectionNode.querySelectorAll<HTMLLIElement>(
                ".total_sections .activity:not(.label)"
            );

            const section: Section = {
                id: index,
                week: null,
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
                    section.week = regexpResult.week;
                    section.date.start_date = regexpResult.start_date;
                    section.date.end_date = regexpResult.end_date;
                }
            }

            activityNodes.forEach((activityNode) => {
                if (activityNode.querySelector(".dimmed")) {
                    return;
                }

                const id = activityNode.getAttribute("id")?.split("-")[1];
                const name =
                    activityNode
                        .querySelector<HTMLSpanElement>(".instancename")
                        ?.firstChild?.textContent?.trim() ?? "";

                if (!id) {
                    return;
                }

                const activity: Activity = {
                    id: parseInt(id),
                    name,
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
        attendanceNodes.forEach((node, index) => {
            let section: Section | undefined;
            const element = node.querySelector(".sname");

            if (element) {
                const week = element.getAttribute("data-target");
                section = course.sections.find((item) => item.week === week);
            } else {
                // 강의 개요를 넣게되면 이 부분 코드 수정할 것
                section = course.sections.find((item) => item.id === index);
            }

            if (!section) {
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

    async RefreshCourseAssignment(id: Number) {
        const course = this.data.find((item) => item.id === id);

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

    // async RefreshCourseQuiz(id: Number) {
    //     const course = this.data.find((item) => item.id === id);

    //     if (!course) {
    //         return;
    //     }

    //     const document = await GetDOMPage("/mod/quiz/index.php?id=" + id);
    //     const $$ = document.querySelectorAll.bind(document);

    //     let nodes = Array.from($$("table tbody:not(.empty) tr[class]"));

    //     for (let node of nodes) {
    //         let cells = node.querySelectorAll("td");

    //         const sectionName = cells[0].textContent?.trim();
    //         const section = course.sections.find((item) => item.name === sectionName);
    //         const activityId = cells[1]
    //             ?.querySelector("a")
    //             ?.getAttribute("href")
    //             ?.split("?id=")[1];
    //         const activityName = cells[1].textContent ?? "";
    //         const activityDate = cells[2] ? dayjs(cells[2].textContent) : null;
    //         const activityComplete = cells[3].textContent === "제출 완료";

    //         if (!activityId || !section) {
    //             continue;
    //         }

    //         let activity = section.activitys.find(
    //             (item) => item.id === parseInt(activityId)
    //         );

    //         if (!activity) {
    //             section.activitys.push({
    //                 id: parseInt(activityId),
    //                 name: activityName,
    //                 type: ActivityType.Assignment,
    //                 complete: activityComplete,
    //                 date: {
    //                     start_date: null,
    //                     end_date: activityDate?.format() ?? null
    //                 }
    //             });
    //         } else {
    //             activity.complete = activityComplete;
    //             activity.date.end_date = activityDate?.format() ?? null;
    //         }
    //     }
    // },

    // async RefreshCourseQuizInfo(id: Number) {
    //     const document = await GetDOMPage("/mod/quiz/view.php?id=" + id);
    //     const $ = document.querySelector.bind(document);
    //     const $$ = document.querySelectorAll.bind(document);
    // },

    async RefreshCourseZoom(id: Number) {
        const course = this.data.find((item) => item.id === id);

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
    }
};
