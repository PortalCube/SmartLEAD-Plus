export function refineCourseOwnerText(text: string) {
    if (!text) {
        // 알 수 없는 강의자
        return "";
    }

    const regex = /\d{6,6}-\d{2,2}/g;
    if (regex.test(text)) {
        // 정규 교과목
        const arr = text.split("/");
        arr.shift();

        return arr.map((item) => item.trim()).join(", ");
    } else {
        // 특수 강의
        return text.trim();
    }
}
