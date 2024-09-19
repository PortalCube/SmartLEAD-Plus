import { GetCourseDetailResponse } from "../scripts/api.ts";
import { BASE_URL } from "./constant.ts";

export enum MoodleActivityType {
    Unknown = "UNKNOWN",
    Label = "LABEL",
    Video = "VIDEO",
    Assignment = "ASSIGNMENT",
    Quiz = "QUIZ",
    Vote = "VOTE",
    Survey = "SURVEY",
    Zoom = "ZOOM",
    File = "FILE",
    Folder = "FOLDER",
    URL = "URL",
    Board = "BOARD",
    Document = "DOCUMENT",
    // Externaltool,
    // Wiki,
    // ELearning,
    // Chat,
    // Discussion,
    // Teamvote,
}

const activityTypeMap: { key: string; value: MoodleActivityType }[] = [
    { key: "label", value: MoodleActivityType.Label },
    { key: "assign", value: MoodleActivityType.Assignment },
    { key: "ubboard", value: MoodleActivityType.Board },
    { key: "page", value: MoodleActivityType.Document },
    { key: "ubfile", value: MoodleActivityType.File },
    { key: "folder", value: MoodleActivityType.Folder },
    { key: "label", value: MoodleActivityType.Label },
    { key: "quiz", value: MoodleActivityType.Quiz },
    { key: "feedback", value: MoodleActivityType.Survey },
    { key: "url", value: MoodleActivityType.URL },
    { key: "vod", value: MoodleActivityType.Video },
    { key: "choice", value: MoodleActivityType.Vote },
    { key: "zoom", value: MoodleActivityType.Zoom },
];

export interface MoodleActivity {
    id: number;
    modId: number; // vod 진행 상황 추적할 때 쓰임
    courseId: number;
    sectionId: number;
    name: string;
    description: string | null;
    type: MoodleActivityType;
    visible: boolean;
    progress: number | null; // 0.0 ~ 1.0 (0% ~ 100%)
    startDate: number | null;
    endDate: number | null;
    files?: MoodleFile[];
}

export interface MoodleFile {
    id: number;
    authorId: number;
    authorName: string;
    name: string;
    path: string;
    url: string;
    size: number;
    createdDate: number;
    modifiedDate: number;
}

export function convertActivityType(type: string): MoodleActivityType {
    const activityType = activityTypeMap.find((item) => item.key === type);
    return activityType?.value ?? MoodleActivityType.Unknown;
}

export function convertResponseToActivitys(
    response: GetCourseDetailResponse[],
    courseId: number
): MoodleActivity[] {
    const result: MoodleActivity[] = [];

    for (const section of response) {
        const sectionId = section.id;

        for (const module of section.modules) {
            const type = convertActivityType(module.modname);

            const activity: MoodleActivity = {
                id: module.id,
                modId: module.instance,
                courseId,
                sectionId,
                name: module.name,
                description: module.description,
                type,
                visible: module.visible === 1,
                progress: null,
                startDate: null,
                endDate: null,
            };

            if (type === MoodleActivityType.File) {
                activity.files = module.contents?.map((item) => {
                    const id = item.fileurl.split("/")[5];
                    return {
                        id: Number(id),
                        authorId: item.userid,
                        authorName: item.author,
                        name: item.filename,
                        path: item.filepath,
                        url: item.fileurl,
                        size: item.filesize,
                        createdDate: item.timecreated,
                        modifiedDate: item.timemodified,
                    };
                });
            } else if (type === MoodleActivityType.Video) {
                // 온라인 출석부를 사용하지 않는 비디오는 progress가 제대로 지정되지 않는 경우가 있어서
                // 비디오의 경우에는 progress를 0으로 지정
                activity.progress = 0;
            }

            result.push(activity);
        }
    }

    return result;
}

export function getActivityUrl(activity: MoodleActivity) {
    const find = activityTypeMap.find((item) => item.value === activity.type);

    if (find === undefined) {
        // UNKNOWN
        return BASE_URL + `/course/view.php?id=${activity.courseId}`;
    } else if (activity.type === MoodleActivityType.Video) {
        // 동영상에 직접 접속
        return BASE_URL + `/mod/vod/viewer.php?id=${activity.id}`;
    } else {
        return BASE_URL + `/mod/${find.key}/view.php?id=${activity.id}`;
    }
}

export function getActivityIcon(activity: MoodleActivity) {
    const find = activityTypeMap.find((item) => item.value === activity.type);

    if (find === undefined) {
        // UNKNOWN
        return (
            BASE_URL +
            "/theme/image.php/coursemosv2/local_ubion/1709108584/course_format/mod_icon/label"
        );
    } else {
        return (
            BASE_URL +
            `/theme/image.php/coursemosv2/local_ubion/1709108584/course_format/mod_icon/${find.key}`
        );
    }
}
