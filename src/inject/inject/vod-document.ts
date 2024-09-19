import { VodCompleteMessage, VodMessageType } from "./vod-message.ts";

(function () {
    const qs = new URLSearchParams(location.search);
    const activityId = Number(qs.get("id") ?? -1);

    let isPlaying = false;
    let visibilityChange = false;

    // 필요한 데이터 보내기
    console.log("VOD document injected");

    // @ts-ignore
    window.remote_vod_pause = () => {};

    const player = jwplayer("vod_player");

    // player.on("play", () => {
    //     isPlaying = true;
    // });

    // player.on("pause", () => {
    //     if (visibilityChange) {
    //         player.play();
    //         visibilityChange = false;
    //         return;
    //     }

    //     isPlaying = false;
    // });

    player.on("complete", () => {
        console.log("재생 종료");
        const message: VodCompleteMessage = {
            type: VodMessageType.VideoComplete,
            data: {
                id: activityId,
                position: player.getPosition(),
                duration: player.getDuration(),
            },
            _slplusVodMessage: true,
        };

        window.postMessage(message);
    });

    setInterval(() => {
        console.log(player.getPosition(), player.getState());
    }, 100);

    // document.addEventListener("visibilitychange", () => {
    //     visibilityChange = true;
    // });
})();
