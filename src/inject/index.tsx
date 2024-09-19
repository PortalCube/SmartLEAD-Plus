import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import arraySupport from "dayjs/plugin/arraySupport";
import objectSupport from "dayjs/plugin/objectSupport";
import "dayjs/locale/ko";
import { normalizeFilename } from "../librarys/normalizeFilename.ts";
import login from "./inject/login.ts";
import vod from "./inject/vod.tsx";

// 스타일시트 적용
import "./style.scss";
import { loadUserToken } from "../librarys/dataStorage.ts";

// dayjs 플러그인 및 로케일 적용
dayjs.extend(relativeTime);
dayjs.extend(arraySupport);
dayjs.extend(objectSupport);
dayjs.locale("ko");

const router = [
    // {
    //     path: "/", // 루트 페이지
    //     handler: main,
    // },
    {
        path: "/login.php", // 로그인 페이지
        handler: login,
    },
    {
        path: "/course/view.php", // 강의실 페이지
        handler: () => {},
    },
    {
        path: "/mod/vod/viewer.php", // VOD 페이지
        handler: vod,
    },
];

// --------------------------
// 유틸리티
// --------------------------

// 파일 이름을 NFC로 정규화
normalizeFilename();

// AI 튜터 비활성화
chrome.runtime.sendMessage({
    type: "ai_tutor",
    payload: {
        active: false,
    },
});

// 현재 페이지에 맞는 injection script 실행
router.find((route) => route.path === location.pathname)?.handler();
