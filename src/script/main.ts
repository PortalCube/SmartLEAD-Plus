"use strict";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import arraySupport from "dayjs/plugin/arraySupport";
import objectSupport from "dayjs/plugin/objectSupport";
import "dayjs/locale/ko";

import "./style.scss";

import { CourseManager } from "./course-manager";
import { DOMManager } from "./dom-manager";

export const ExtensionManager = {
    async Init() {
        // 데이터 불러오기
        await CourseManager.LoadData();

        console.log(CourseManager.courses);

        // 경로에 따라서 페이지 구성하기
        switch (location.pathname) {
            case "/":
                // 메인 페이지
                await this.InitLandingPage();
                break;
            case "/course/view.php":
                // 강좌 메인 페이지
                await this.InitCoursePage();
                break;
        }
    },

    async InitLandingPage() {
        DOMManager.BuildLandingPage();
    },

    async InitCoursePage() {},

    async InitVideoPage() {}
};

// 패키지 세팅
(() => {
    dayjs.extend(relativeTime);
    dayjs.extend(arraySupport);
    dayjs.extend(objectSupport);
    dayjs.locale("ko");

    ExtensionManager.Init();
})();
