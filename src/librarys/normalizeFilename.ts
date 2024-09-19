export function normalizeFilename() {
    document.querySelectorAll("a").forEach((item: HTMLAnchorElement) => {
        const regexr =
            /https:\/\/smartlead\.hallym\.ac\.kr\/mod\/ubfile\/view\.php\?id=(\d+)/g;

        const find = regexr.exec(item.href);

        if (!find) {
            return;
        }

        const id = find[1];

        // Anchor Element의 기본 클릭을 변경
        item.addEventListener("click", async (event) => {
            // 브라우저 기본 다운로드 동작 제거
            event.preventDefault();

            // 파일 내용을 제외한 Response 헤더를 가져오기
            const response = await fetch(
                `https://smartlead.hallym.ac.kr/mod/ubfile/view.php?id=${id}`,
                { method: "HEAD" }
            );

            const url = new URL(response.url);

            // redirect가 없다면 페이지를 불러오는 것이므로 취소
            if (url.pathname === "/mod/ubfile/view.php") {
                return;
            }

            // redirect된 헤더에서 파일명 추출 후 NFC 형식으로 수정
            const filename = decodeURIComponent(
                url.pathname.split("/").pop()!
            ).normalize("NFC");

            // chrome extension 자체 Download API로 다시 인코딩된 파일명으로 다운로드
            chrome.runtime.sendMessage({
                type: "download",
                payload: {
                    url,
                    filename,
                },
            });
        });
    });
}
