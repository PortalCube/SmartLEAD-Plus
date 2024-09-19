import { loadUserToken } from "../../librarys/dataStorage.ts";

export default async function mainInject() {
    const { token } = await loadUserToken();

    if (token === undefined) {
        // 로그인 페이지로
        location.pathname = "/login.php";
    } else {
        // 대시보드 페이지로
        location.pathname = "/dashboard.php";
    }
}
