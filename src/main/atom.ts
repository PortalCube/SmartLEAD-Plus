import { atom } from "jotai";
import { MoodleCourse } from "../librarys/course.ts";
import { MoodleActivity } from "../librarys/activity.ts";
import { MoodleSection } from "../librarys/section.ts";
import { Dayjs } from "dayjs";

export const coursesAtom = atom<MoodleCourse[]>([]);
export const sectionsAtom = atom<MoodleSection[]>([]);
export const activitysAtom = atom<MoodleActivity[]>([]);
export const modifiedDateAtom = atom<Dayjs | null>(null);
