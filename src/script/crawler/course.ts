import {
    GetDOMPage,
    GetWeekDate,
    IsWeekText,
    Section,
    AttendanceStatus,
    Activity,
    ActivityType,
    DurationToSecond
} from "../util";
import dayjs, { Dayjs } from "dayjs";

export async function ScrapCoursePage2(id: Number) {
    const document = await GetDOMPage("/course/view.php?id=" + id);
    const isRegularCourse =
        document.querySelector<HTMLAnchorElement>(".submenu-syllabus") !== null;
    const attendanceNodes = document.querySelectorAll<HTMLLIElement>(".attendance > li");
    const sectionNodes = document.querySelectorAll<HTMLLIElement>(
        ".total_sections .weeks li.section"
    );

    const sections: Section[] = [];

    let startDate: Dayjs | null = null;

    // 각 섹션 긁어오기
    sectionNodes.forEach((sectionNode, index) => {
        const sectionName = sectionNode.getAttribute("aria-label") || "";
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

        if (isRegularCourse) {
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

        sections.push(section);
    });

    // 출결 정보 체크
    attendanceNodes.forEach((node, index) => {
        let section: Section | undefined;
        const element = node.querySelector(".sname");

        if (element) {
            const week = element.getAttribute("data-target");
            section = sections.find((item) => item.week === week);
        } else {
            // 강의 개요를 넣게되면 이 부분 코드 수정할 것
            section = sections.find((item) => item.id === index);
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

    return sections;
}
