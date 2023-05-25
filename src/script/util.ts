import dayjs from "dayjs";

export const REGEX = {
    get WEEK() {
        return /^(\d{1,2})주차 \[(\d{1,2})월(\d{1,2})일 - (\d{1,2})월(\d{1,2})일\]$/g;
    }
};

export enum ActivityType {
    Unknown = 0,
    Video = 1,
    Assignment = 2,
    Quiz = 3,
    Vote = 4,
    Survey = 5,
    Zoom = 6
    // File,
    // URL,
    // Board,
    // ExternalTool,
    // Document,
    // Wiki,
    // ELearning,
    // Chat,
    // Discussion,
    // TeamVote,
    // Folder
}

export enum AttendanceStatus {
    None,
    Absence,
    Attend,
    Late
}

export type Period = {
    start_date: string | null;
    end_date: string | null;
};

export type Activity = {
    id: Number;
    name: string;
    type: ActivityType;
    complete: boolean;
    date: Period;
    video?: {
        length: Number;
        require: Number | null;
        watched: Number | null;
    };
};

export type Section = {
    id: Number;
    name: string;
    date: Period;
    status: AttendanceStatus;
    activitys: Activity[];
};

export type Course = {
    id: Number;
    name: string;
    owner: string;
    isRegular: boolean;
    sections: Section[];
};

export async function Fetch(url: string) {
    const response = await fetch(url);
    return await response.text();
}

export async function GetDOMPage(url: string) {
    const raw = await Fetch(url);
    return new DOMParser().parseFromString(raw, "text/html");
}

export function IsWeekText(text: string) {
    return REGEX.WEEK.test(text);
}

export function GetWeekDate(text: string) {
    const result = REGEX.WEEK.exec(text);

    if (!result || result.length < 6) {
        return null;
    } else {
        return {
            start_date: dayjs({
                year: dayjs().get("year"),
                month: parseInt(result[2]) - 1,
                day: parseInt(result[3]),
                hour: 0,
                minute: 0,
                second: 0
            }).format(),
            end_date: dayjs({
                year: dayjs().get("year"),
                month: parseInt(result[4]) - 1,
                day: parseInt(result[5]),
                hour: 23,
                minute: 59,
                second: 59
            }).format()
        };
    }
}

export function DurationToSecond(text: string) {
    return text
        .split(":")
        .reduce(
            (sum, item, index, array) =>
                sum + parseInt(item) * Math.pow(60, array.length - index - 1),
            0
        );
}
