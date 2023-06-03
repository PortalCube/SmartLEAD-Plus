"use strict";

import LandingPage from "../html/landing/main.html?raw";
import LandingBackground from "../html/landing/background.html?raw";
import LandingCourseContainer from "../html/landing/course.html?raw";
import LandingCourseItem from "../html/landing/course-item.html?raw";
import LandingTodoContainer from "../html/landing/todo.html?raw";
import LandingTodoItem from "../html/landing/todo-item.html?raw";
// import LandingWeekly from "../html/landing/weekly.html?raw";
// import CourseProgress from "../html/course/progress.html?raw";

import dayjs from "dayjs";
import { decode } from "blurhash";

import { CourseManager } from "./course-manager";
import { ActivityType, StringToNode } from "./util";

const $ = document.querySelector.bind(document);
// const $$ = document.querySelectorAll.bind(document);

export const DOMManager = {
    landingMode: 1,

    BuildLandingPage() {
        const element = $<HTMLDivElement>(".progress_courses");

        if (!element) {
            console.error(`BuildLandingPageElement: 랜딩 페이지 Injection 실패`);
            return;
        }

        element.classList.add("smartlead-plus");

        element.innerHTML = LandingPage;

        const summeryList = element.querySelector<HTMLDivElement>(".summery-list");
        const courseList = element.querySelector<HTMLDivElement>(".course-list");
        const todoList = element.querySelector<HTMLDivElement>(".todo-list");

        if (!summeryList || !courseList || !todoList) {
            return;
        }

        courseList.onclick = () => {
            if (this.landingMode !== 2) {
                summeryList.classList.remove("selected");
                todoList.classList.remove("selected");
                courseList.classList.add("selected");
                this.BuildCourseElement();
            }
        };

        todoList.onclick = () => {
            if (this.landingMode !== 1) {
                summeryList.classList.remove("selected");
                courseList.classList.remove("selected");
                todoList.classList.add("selected");
                this.BuildTodoElement();
            }
        };

        // Summery Page Build
        this.BuildTodoElement();
        todoList.classList.add("selected");
    },

    async BuildBackground() {
        const element = $<HTMLDivElement>("#page-container");
        const backgroundElement = StringToNode(LandingBackground)[0] as HTMLDivElement;

        if (!element) {
            return;
        }

        element.prepend(backgroundElement);

        const res = await fetch(
            "https://api.kiriko.dev/smartlead-plus/v1/wallpaper/korea/10m"
        );
        const data = (await res.json())[0];

        const blurhash = data.blur_hash as string;
        const location = data.location.name as string;
        const user = data.user.name as string;
        let src = data.urls.full as string;
        src =
            src.replace("&fm=jpg", "&fm=webp") +
            "&dpr=1.5&w=" +
            window.screen.width.toString();

        const canvas = backgroundElement.querySelector("canvas");

        if (canvas) {
            const width = (canvas.width = 16);
            const height = (canvas.height = 10);
            const ctx = canvas.getContext("2d");

            if (ctx) {
                const imageArray = ctx.createImageData(width, height);
                const blurhashArray = decode(blurhash, width, height);
                imageArray.data.set(blurhashArray);
                ctx.putImageData(imageArray, 0, 0);
            }

            setTimeout(() => canvas.classList.add("complete"), 500);
        }

        const credit = backgroundElement.querySelector("p");

        if (!credit) {
            return;
        }

        if (location) {
            credit.textContent = `위치: ${location}\n`;
        }

        credit.textContent += `${user}님의 사진`;

        const img = backgroundElement.querySelector("img");

        if (!img) {
            return;
        }

        img.onload = () => img.classList.add("complete");

        img.src = src;
    },

    BuildTodoElement() {
        this.landingMode = 1;
        const container = $<HTMLDivElement>(".smartlead-plus .landing-container");

        if (!container) {
            console.error("BuildTodoElement: 컨테이너 Element를 찾을 수 없습니다.");
            return;
        }

        const todoContainer = StringToNode(LandingTodoContainer)[0] as HTMLDivElement;

        container.innerHTML = "";
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
    },

    BuildCourseElement() {
        this.landingMode = 2;
        const container = $<HTMLDivElement>(".smartlead-plus .landing-container");

        if (!container) {
            console.error("BuildCourseElement: 컨테이너 Element를 찾을 수 없습니다.");
            return;
        }

        const courseContainer = StringToNode(LandingCourseContainer)[0] as HTMLDivElement;

        container.innerHTML = "";
        container.appendChild(courseContainer);

        for (const course of CourseManager.courses) {
            const color = `rgb(${Math.floor(Math.random() * 256)}, ${Math.floor(
                Math.random() * 256
            )}, ${Math.floor(Math.random() * 256)})`;

            let itemElement = LandingCourseItem.replace(
                "{URL}",
                "https://smartlead.hallym.ac.kr/course/view.php?id=" + course.id
            )
                .replace("{COLOR}", color)
                .replace("{TITLE}", course.name)
                .replace("{SUBTITLE}", course.owner);

            courseContainer.innerHTML += itemElement;
        }
    }
};
