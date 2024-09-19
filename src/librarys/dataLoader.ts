import { MoodleCourse } from "./course.ts";
import {
    loadMoodleData,
    saveMoodleData,
    loadUserToken,
} from "./dataStorage.ts";
import { scrapData } from "./scrappingCourse.ts";
import dayjs from "dayjs";
import { MoodleSection } from "./section.ts";
import { MoodleActivity } from "./activity.ts";

export async function loadData() {
    const storageData = await loadMoodleData();

    if (storageData.info && storageData.info.modifiedAt) {
        if (
            dayjs(storageData.info.modifiedAt) > dayjs().subtract(10, "minute")
        ) {
            // 마지막 업데이트 10분 이내
            return {
                courses: storageData.courses as MoodleCourse[],
                sections: storageData.sections as MoodleSection[],
                activitys: storageData.activitys as MoodleActivity[],
                modifiedDate: dayjs(storageData.info.modifiedAt),
            };
        }
    }

    const { token, id } = await loadUserToken();
    if (!token) {
        return null;
    }

    const response = await scrapData(token, id);
    if (!response) {
        return null;
    }

    const { courses, sections, activitys } = response;

    const modifiedDate = await saveMoodleData(courses, sections, activitys);

    return { ...response, modifiedDate };
}
