import { GetCourseListResponse } from "../scripts/api.ts";

export enum MoodleCourseType {
    Offline = "OFFLINE",
    ELearning = "ELEARNING",
    Blend = "BLEND",
    User = "USER_MANAGED",
    RegularUnknown = "REGULAR_UNKNOWN",
    Unknown = "UNKNOWN",
}

export enum MoodleSectionType {
    Regular = "REGULAR",
    Custom = "USER_DEFINED",
}

export interface MoodleCourse {
    id: number;
    type: MoodleCourseType;
    typeName: string;
    name: string;
    englishName: string;
    imageUrl: string | null;
    ownerName: string | null;
    sectionType: MoodleSectionType;
    sectionLength: number;
    startDate: number;
    endDate: number;
    classRoom: string | null;
    classTime: string | null;
    classDivision: string | null;
    authentication: boolean;
}

function convertCourseType(type: string): MoodleCourseType {
    switch (type) {
        case "R_OFF":
            return MoodleCourseType.Offline;
        case "R_ELEARNING":
            return MoodleCourseType.ELearning;
        case "R_BLEND":
            return MoodleCourseType.Blend;
        case "CMS_E":
            return MoodleCourseType.User;
        default:
            return type.startsWith("R_")
                ? MoodleCourseType.RegularUnknown
                : MoodleCourseType.Unknown;
    }
}

function convertSectionType(type: string): MoodleSectionType {
    return type === "ubsweeks"
        ? MoodleSectionType.Regular
        : MoodleSectionType.Custom;
}

export function convertResponseToCourse(
    response: GetCourseListResponse[0]
): MoodleCourse {
    const type = convertCourseType(response.course_type);
    const sectionType = convertSectionType(response.format);

    return {
        id: response.id,
        type,
        typeName: response.course_type_name,
        name: response.fullname,
        englishName: response.ename,
        imageUrl: null,
        ownerName: null,
        sectionType,
        sectionLength: response.numsections,
        startDate: Number(response.study_start),
        endDate: Number(response.study_end),
        classRoom: response.room_nm,
        classTime: response.day_cd,
        classDivision: response.bunban_code,
        authentication: response.authentication === 1,
    };
}
