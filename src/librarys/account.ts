import { NavigateFunction } from "react-router-dom";
import { ErrorResponse, isMoodleError, postLogin } from "../scripts/api.ts";
import { fetchDocument } from "../scripts/util.ts";
import {
    BASE_DOMAIN,
    BASE_URL,
    DASHBOARD_URL,
    LOGIN_POST_URL,
    LOGIN_SUCCESSFUL_URL,
    LOGOUT_URL,
    MOODLE_SESSION_NAME,
} from "./constant.ts";
import {
    removeMoodleData,
    removeUserToken,
    writeUserToken,
} from "./dataStorage.ts";

// 세션 토큰 상태 확인
export async function checkSession() {
    const response = await fetch(DASHBOARD_URL);
    return response.url === DASHBOARD_URL;
}

// 전체 로그아웃
export async function logout(navigate?: NavigateFunction) {
    // 세션 로그아웃
    await fetch(LOGOUT_URL);

    // 만약 네비게이터가 주어졌다면, login으로 이동
    if (navigate) {
        navigate("/login");
    }
}

// 코스모스 API에 로그인하고 토큰을 스토리지에 저장
export async function apiLogin(
    id: string,
    password: string,
    noSession: boolean
) {
    // 코스모스 API 로그인
    const response = await postLogin(id, password);

    // 오류 발생시 false 반환
    if (isMoodleError(response)) {
        return false;
    }

    // 토큰을 SessionStorage에 저장
    await writeUserToken(response.utoken, Number(response.id), noSession);

    return true;
}

// 스마트리드에 로그인하고 세션을 24시간 만료로 수정
export async function sessionLogin(id: string, password: string) {
    // FormData 생성
    const formData = new FormData();
    formData.append("ssoGubun", "Login");
    formData.append("type", "popup_login");
    formData.append("username", id);
    formData.append("password", password);
    formData.append("rememberssoid", "1");

    // 요청 전송
    const response = await fetch(LOGIN_POST_URL, {
        method: "POST",
        body: formData,
    });

    // 응답 분석
    const url = new URL(response.url);
    const pathUrl = url.origin + url.pathname;

    if (pathUrl === LOGIN_SUCCESSFUL_URL) {
        // 로그인 성공
        // await extendSessionCookie();
        return true;
    }

    return false;
}

export async function extendSessionCookie() {
    // 기존 세션 쿠키가 있는지 체크
    const sessionCookie = await chrome.cookies.get({
        name: MOODLE_SESSION_NAME,
        url: BASE_URL,
    });

    if (sessionCookie === null) {
        return;
    }

    // 기존 세션 쿠키를 제거
    await removeSessionCookie();

    // 세션 쿠키 길이를 1시간 연장하여 다시 지정
    const value = sessionCookie?.value;
    const expire = Math.floor(Date.now() / 1000) + 24 * 60 * 60;
    await chrome.cookies.set({
        url: BASE_URL,
        name: MOODLE_SESSION_NAME,
        value: value,
        domain: BASE_DOMAIN,
        path: "/",
        httpOnly: true,
        expirationDate: expire,
    });
}

// 기존 세션 쿠키를 제거
export async function removeSessionCookie() {
    const sessions = await chrome.cookies.getAll({
        name: MOODLE_SESSION_NAME,
        url: BASE_URL,
    });

    for (let i = 0; i < sessions.length; i++) {
        await chrome.cookies.remove({
            name: MOODLE_SESSION_NAME,
            url: BASE_URL,
        });
    }
}
