import { apiLogin } from "../../librarys/account.ts";
import { removeMoodleData } from "../../librarys/dataStorage.ts";

export default function loginInject() {
    const idElement = document.querySelector<HTMLInputElement>(
        "input[name=username]"
    );
    const passwordElement = document.querySelector<HTMLInputElement>(
        "input[name=password]"
    );
    const buttonElement = document.querySelector<HTMLInputElement>(
        "input[name=loginbutton]"
    );

    // 로그인 버튼 클릭시 Moodle API로 로그인 후 토큰을 저장
    buttonElement?.addEventListener("click", async () => {
        const id = idElement?.value ?? "";
        const password = passwordElement?.value ?? "";

        // 코스모스 API 로그인
        await apiLogin(id, password, false);

        // 기존 데이터 제거
        await removeMoodleData();

        // 쿠키 길이 연장 -- 익스텐션 페이지 전용으로 일단 냅둠
        // await extendSessionCookie();
    });
}
