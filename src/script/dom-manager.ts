"use strict";

import LandingPage from "../html/landing/main.html?raw";
import LandingCourse from "../html/landing/course.html?raw";
import LandingTodoContainer from "../html/landing/todo.html?raw";
import LandingTodoItem from "../html/landing/todo-item.html?raw";
import LandingWeekly from "../html/landing/weekly.html?raw";
import CourseProgress from "../html/course/progress.html?raw";

import dayjs from "dayjs";

import { CourseManager } from "./course-manager";
import { ActivityType, StringToNode } from "./util";

const $ = document.querySelector.bind(document);
const $$ = document.querySelectorAll.bind(document);

export const DOMManager = {
    BuildLandingPage() {
        const element = $<HTMLDivElement>(".progress_courses");

        if (!element) {
            console.error(`BuildLandingPageElement: 랜딩 페이지 Injection 실패`);
            return;
        }

        element.classList.add("smartlead-plus");

        element.innerHTML = LandingPage;

        // this.UpdateImage();
        this.BuildBackground();

        // Summery Page Build
        this.BuildTodoElement();
    },

    BuildBackground() {
        const element = $<HTMLDivElement>("#page-container");
        const backgroundElement = document.createElement("div");

        backgroundElement.classList.add("smartlead-plus", "landing-background");

        if (!element) {
            return;
        }

        element.prepend(backgroundElement);
    },

    BuildTodoElement() {
        const container = $<HTMLDivElement>(".smartlead-plus .landing-container");

        if (!container) {
            console.error("BuildTodoElement: 컨테이너 Element를 찾을 수 없습니다.");
            return;
        }

        const todoContainer = StringToNode(LandingTodoContainer)[0] as HTMLDivElement;

        container.appendChild(todoContainer);

        const list = CourseManager.activitys.filter(
            (item) =>
                !item.complete &&
                [
                    ActivityType.Assignment,
                    ActivityType.Video,
                    ActivityType.Quiz,
                    ActivityType.Zoom
                ].includes(item.type) &&
                item.date.end_date !== null &&
                dayjs(item.date.end_date) > dayjs()
        );

        list.sort((a, b) => {
            const date =
                dayjs(a.date.end_date).valueOf() - dayjs(b.date.end_date).valueOf();
            if (date === 0) {
                const course = a.course_id - b.course_id;
                if (course === 0) {
                    return a.name.localeCompare(b.name);
                } else {
                    return course;
                }
            } else {
                return date;
            }
        });

        for (const item of list) {
            let url = "",
                icon = "";

            switch (item.type) {
                case ActivityType.Video:
                    url = "/mod/vod/viewer.php?id=";
                    icon =
                        "/theme/image.php/coursemosv2/local_ubion/1681179291/course_format/mod_icon/vod";
                    break;
                case ActivityType.Assignment:
                    url = "/mod/assign/view.php?id=";
                    icon =
                        "/theme/image.php/coursemosv2/local_ubion/1681179291/course_format/mod_icon/assign";
                    break;
                case ActivityType.Quiz:
                    url = "/mod/quiz/view.php?id=";
                    icon =
                        "/theme/image.php/coursemosv2/local_ubion/1681179291/course_format/mod_icon/quiz";
                    break;
                case ActivityType.Zoom:
                    url = "/mod/zoom/view.php?id=";
                    icon =
                        "/theme/image.php/coursemosv2/local_ubion/1681179291/course_format/mod_icon/zoom";
                    break;
            }

            url += item.id.toString();

            const activityName = item.name;
            const courseName =
                CourseManager.courses.find((course) => course.id === item.course_id)
                    ?.name ?? "";
            const endDate = dayjs(item.date.end_date);
            const timeLeft = endDate.fromNow(true) + " 뒤 마감";
            const expireDate = "마감일: " + endDate.format("YYYY.MM.DD HH:mm");

            let level = 0;
            const timeLeftHour = Math.abs(dayjs().diff(endDate, "hour"));

            if (timeLeftHour < 6) {
                level = 4; // 6시간
            } else if (timeLeftHour < 24) {
                level = 3; // 1일
            } else if (timeLeftHour < 24 * 5) {
                level = 2; // 5일
            } else if (timeLeftHour < 24 * 10) {
                level = 1; // 10일
            }

            let itemElement = LandingTodoItem.replace("{URL}", url)
                .replace("{ICON}", icon)
                .replace("{TITLE}", activityName)
                .replace("{SUBTITLE}", courseName)
                .replace("{LEVEL}", level.toString())
                .replace("{TIMELEFT}", timeLeft)
                .replace("{EXPIRE}", expireDate);

            todoContainer.innerHTML += itemElement;
        }
    }
};
