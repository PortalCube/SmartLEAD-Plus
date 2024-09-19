import ReactDOM from "react-dom/client";
import VodDownloadButton from "../components/VodDownloadButton.tsx";

// @ts-ignore
import documentScript from "./vod-document.ts?script&module";
import {
    VodCompleteMessage,
    VodMessage,
    VodMessageType,
} from "./vod-message.ts";

function RenderRoot(selector: string, node: React.ReactNode) {
    const root = document.querySelector(selector);

    if (root) {
        ReactDOM.createRoot(root).render(node);
        root.classList.add("slplus");
    }
}

function handleVideoComplete(message: VodCompleteMessage) {
    const id = message.data.id;
    console.log(message);

    chrome.runtime.sendMessage({
        type: "notification",
        payload: {
            id: `slplus-vod-complete-${id}`,
            type: "basic",
            title: "SmartLEAD+ 동영상 재생 완료",
            message: `${id} 동영상의 재생이 완료되었습니다.`,
        },
    });
}

export default function vodInject() {
    window.addEventListener("message", (event) => {
        if (event.data._slplusVodMessage !== true) {
            return;
        }

        const message = event.data as VodMessage;

        if (message.type === VodMessageType.VideoComplete) {
            handleVideoComplete(message as VodCompleteMessage);
        }
    });

    const script = document.createElement("script");
    script.src = chrome.runtime.getURL(documentScript);
    script.type = "module";
    document.head.prepend(script);

    const element = document.querySelector<HTMLDivElement>(".jw-preview");

    if (!element) {
        // 썸네일로 UUID를 구할 수 없음 -- Injection 불가
        return;
    }

    //@ts-ignore
    console.log("jwplayer", window.jwplayer);

    const uuid = element.style.backgroundImage.split("/")[3];
    const title = document.querySelector("title")?.textContent ?? uuid;

    const reactRoot = document.createElement("div");
    reactRoot.id = "slplus-vod-download";
    reactRoot.classList.add("vod_help");
    reactRoot.style.height = "100%";

    const parent = document.querySelector("#vod_header");
    parent?.insertBefore(reactRoot, parent?.childNodes[4]);

    RenderRoot(
        "#slplus-vod-download",
        <VodDownloadButton title={title} uuid={uuid} />
    );
}
