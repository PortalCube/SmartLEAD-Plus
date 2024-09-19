import { BASE_URL } from "../librarys/constant.ts";

export async function fetchDocument(url: string) {
    const response = await fetch(BASE_URL + url);
    const responseText = await response.text();
    return new DOMParser().parseFromString(responseText, "text/html");
}
