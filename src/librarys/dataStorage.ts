import dayjs from "dayjs";
import { MoodleCourse } from "./course.ts";
import { MoodleSection } from "./section.ts";
import { MoodleActivity } from "./activity.ts";
import { BASE_URL } from "./constant.ts";

export async function saveMoodleData(
    courses: MoodleCourse[],
    sections: MoodleSection[],
    activitys: MoodleActivity[]
) {
    const modifiedDate = dayjs();
    await chrome.storage.local.set({
        info: {
            modifiedAt: modifiedDate.format(),
        },
        courses,
        sections,
        activitys,
    });

    return modifiedDate;
}

export async function loadMoodleData() {
    const { info } = await chrome.storage.local.get("info");
    const { courses } = await chrome.storage.local.get("courses");
    const { sections } = await chrome.storage.local.get("sections");
    const { activitys } = await chrome.storage.local.get("activitys");

    return {
        info,
        courses,
        sections,
        activitys,
    };
}

export async function removeMoodleData() {
    await chrome.storage.local.remove([
        "info",
        "courses",
        "sections",
        "activitys",
    ]);
}

export async function loadUserToken() {
    let response;

    // 로컬 스토리지에서 로드
    response = await chrome.storage.local.get([
        "userToken",
        "userId",
        "userTokenExpire",
    ]);
    console.log(response);
    if (response.userTokenExpire) {
        if (dayjs().isBefore(dayjs(response.userTokenExpire))) {
            // 만료되지 않은 토큰이 있다면 반환
            return { token: response.userToken, id: response.userId };
        } else {
            // 토큰이 만료되었다면 로컬 스토리지 삭제
            await chrome.storage.local.remove([
                "userToken",
                "userId",
                "userTokenExpire",
            ]);
        }
    }

    // 세션 스토리지에서 로드
    response = await chrome.storage.session.get(["userToken", "userId"]);
    console.log(response);
    return { token: response.userToken, id: response.userId };
}

export async function writeUserToken(
    token: string,
    id: number,
    saveAtLocal: boolean
) {
    let response;

    if (saveAtLocal) {
        // 로컬 스토리지
        const expire = dayjs().add(1, "day");
        response = await chrome.storage.local.set({
            userToken: token,
            userId: id,
            userTokenExpire: expire.format(),
        });
    } else {
        // 세션 스토리지
        response = await chrome.storage.session.set({
            userToken: token,
            userId: id,
        });
    }

    return response;
}

export async function removeUserToken() {
    await chrome.storage.local.remove([
        "userToken",
        "userId",
        "userTokenExpire",
    ]);
    await chrome.storage.session.remove(["userToken", "userId"]);
}
