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

    const element =
        document.querySelector<HTMLSourceElement>("#my-video > source");

    console.log(element);

    if (!element) {
        // UUID를 구할 수 없음 -- Injection 불가
        return;
    }

    const uuid = element.src.split("/")[4];
    const titleElement =
        document.querySelector<HTMLHeadingElement>("#vod_header > h1");
    const title = titleElement?.firstChild?.textContent?.trim() ?? uuid;

    const reactRoot = document.createElement("div");
    reactRoot.id = "slplus-vod-download";
    reactRoot.classList.add("vod_help");
    reactRoot.style.height = "100%";

    const parent = document.querySelector("#vod_header");
    parent?.insertBefore(reactRoot, parent?.childNodes[2]);

    RenderRoot(
        "#slplus-vod-download",
        <VodDownloadButton title={title} uuid={uuid} />
    );
}
