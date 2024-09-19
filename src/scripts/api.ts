import { BASE_URL, SCHOOL_TOKEN } from "../librarys/constant.ts";

export type ErrorResponse = {
    errorcode: string;
    exception: string;
    message: string;
};

export type PostLoginResponse = {
    utoken: string;
    id: number;
    userid: string;
    firstname: string;
    lastname: string;
    idnumber: string;
    email: string;
    institution: string;
    department: string;
    phone1: string;
    phone2: string;
    lang: string;
    profileimageurl: string;
    profileimageurlsmall: string;
    usertype: string;
    usertypename: string;
    accounts: any[]; // 무슨 데이터가 들어가는지 확인 필요
};

export type GetCourseListResponse = {
    id: number;
    shortname: string;
    idnumber: string;
    fullname: string;
    ename: string;
    format: string;
    startdate: number;
    groupmode: number;
    groupmodeforce: number;
    lang: string;
    numsections: number;
    year: number;
    semester_code: string;
    roles: {
        roleid: number;
        name: string;
        shortname: string;
    }[];
    setting: number;
    course_type: string;
    course_type_name: string;
    campus: null | string;
    campus_name: null | string;
    cu_visible: number;
    study_start: null | string;
    study_end: null | string;
    day_cd: null | string;
    hour1: null | string;
    room_nm: null | string;
    bunban_code: null | string;
    authentication: number;
}[];

type FileContent = {
    type: string;
    filename: string;
    filepath: string;
    filesize: number;
    fileurl: string;
    timecreated: number;
    timemodified: number;
    sortorder: number;
    userid: number;
    author: string;
    license: string;
};

export type Module = {
    id: number;
    url?: string;
    name: string;
    instance: number;
    description: string | null; // Label은 null
    visible: number;
    modicon: string;
    modname: string;
    modplural: string;
    availability?: null;
    indent: number;
    display: number;
    isdownload: number; // 대부분 1
    downloadurl: string | null; // 대부분 null
    contents?: FileContent[];
};

export type GetCourseDetailResponse = {
    id: number;
    name: string;
    visible: number;
    currentsection: number;
    summary: string;
    summaryformat: number;
    modules: Module[];
};

export type GetActivityListResponse = {
    totalcount: number;
    events: {
        id: number;
        name: string;
        description: string;
        courseid: number;
        groupid: number;
        userid: number;
        modulename: string;
        eventtype: string;
        timestart: number;
        timeduration: number;
        visible: number;
        timemodified: number;
        url: string;
    }[];
};

function createFormdata(data: Record<string, string>) {
    const formData = new FormData();

    for (const key in data) {
        formData.append(key, data[key]);
    }

    formData.append("moodlewsrestformat", "json");
    formData.append("lang", "ko");

    return formData;
}

async function fetchMoodleApi(formData: FormData) {
    const response = await fetch(BASE_URL + "/webservice/rest/server.php", {
        method: "POST",
        body: formData,
    });
    const data = await response.json();

    if (data.data) {
        return data.data;
    } else {
        return data;
    }
}

export function isMoodleError(response: any): response is ErrorResponse {
    return (response as ErrorResponse).errorcode !== undefined;
}

export async function postLogin(
    id: string,
    password: string
): Promise<PostLoginResponse | ErrorResponse> {
    const formData = createFormdata({
        userid: id,
        password: password,
        wstoken: SCHOOL_TOKEN,
        wsfunction: "coursemos_user_login_v2",
    });

    return await fetchMoodleApi(formData);
}

export async function getCourseList(
    token: string
): Promise<GetCourseListResponse | ErrorResponse> {
    const formData = createFormdata({
        wstoken: token,
        wsfunction: "coursemos_course_get_mycourses_v2",
    });

    return await fetchMoodleApi(formData);
}

export async function getCourseDetail(
    courseid: number,
    token: string
): Promise<GetCourseDetailResponse[] | ErrorResponse> {
    const formData = createFormdata({
        courseid: courseid.toString(),
        wstoken: token,
        wsfunction: "coursemos_course_get_contents_v2",
    });

    return await fetchMoodleApi(formData);
}

export async function getActivityScheduleList(
    startDate: number,
    period: number,
    token: string
): Promise<GetActivityListResponse | ErrorResponse> {
    const formData = createFormdata({
        timestart: startDate.toString(),
        periodday: period.toString(),
        filter: "all",
        idvalue: "0",
        maxlimit: "1000",
        page: "0",
        wstoken: token,
        wsfunction: "coursemos_calendar_get_events_v2",
    });

    return await fetchMoodleApi(formData);
}
