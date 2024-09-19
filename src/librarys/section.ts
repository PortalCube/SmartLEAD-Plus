import { GetCourseDetailResponse } from "../scripts/api.ts";
import { MoodleCourse, MoodleSectionType } from "./course.ts";

export interface MoodleSection {
    id: number;
    courseId: number;
    currentSection: boolean;
    name: string;
    summary: string;
    visible: boolean;
    startDate: number | null;
    endDate: number | null;
}

export function convertResponseToSections(
    response: GetCourseDetailResponse[],
    course: MoodleCourse
): MoodleSection[] {
    const sectionType = course.sectionType;
    const sectionDuration =
        (course.endDate - course.startDate) / course.sectionLength;
    const startDate = course.startDate;
    return response.map((item, index) => ({
        id: item.id,
        courseId: course.id,
        currentSection: item.currentsection === 1,
        name: item.name,
        summary: item.summary,
        visible: item.visible === 1,
        startDate:
            sectionType === MoodleSectionType.Regular && index !== 0
                ? startDate + sectionDuration * (index - 1)
                : null,
        endDate:
            sectionType === MoodleSectionType.Regular && index !== 0
                ? startDate + sectionDuration * index - 1
                : null,
    }));
}
