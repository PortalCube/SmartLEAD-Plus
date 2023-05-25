"use strict";
import { CourseManager } from "./course-manager";

(async () => {
    await CourseManager.Load();
    console.log(CourseManager.courses);
    const activitys = CourseManager.activitys;
    console.log(activitys);
})();
