import NotificationImage from "./assets/images/notification.png";
import { disableAiTutor, enableAiTutor } from "./librarys/blockAiTutor.ts";
import { BASE_URL, LOGOUT_URL } from "./librarys/constant.ts";
import { removeMoodleData, removeUserToken } from "./librarys/dataStorage.ts";
import { removeSessionCookie } from "./librarys/account.ts";

console.log("SmartLEAD+ Service Worker Loaded");

// 팝업 페이지 액션 등록
chrome.action.onClicked.addListener(() => {
    chrome.tabs.create({ url: chrome.runtime.getURL("index.html") });
});

// content script에서도 session을 사용할 수 있도록 액세스 레벨 조정
chrome.storage.session.setAccessLevel({
    accessLevel: "TRUSTED_AND_UNTRUSTED_CONTEXTS",
});

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.type === "download") {
        chrome.downloads.download({
            url: request.payload.url,
            filename: request.payload.filename,
        });
    } else if (request.type === "notification") {
        chrome.notifications.create(
            request.payload.id,
            {
                type: request.payload.type,
                title: request.payload.title,
                iconUrl: request.payload.iconUrl || NotificationImage,
                message: request.payload.message,
            },
            request.payload.callback || (() => {})
        );
    } else if (request.type === "ai_tutor") {
        if (request.payload.active === true) {
            enableAiTutor();
        } else {
            disableAiTutor();
        }
    }
});
(async () => {
    chrome.webRequest.onBeforeRequest.addListener(
        (details) => {
            removeSessionCookie();
            removeUserToken();
            removeMoodleData();
        },
        { urls: [LOGOUT_URL + "*"] }
    );
})();
