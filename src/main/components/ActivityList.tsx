import styled from "styled-components";
import ActivityItem from "./ActivityItem.tsx";
import { activitysAtom, coursesAtom, modifiedDateAtom } from "../atom.ts";
import { useAtom } from "jotai";
import Panel from "./Panel.tsx";
import { MoodleActivity } from "../../librarys/activity.ts";
import { MoodleCourse } from "../../librarys/course.ts";

const Container = styled(Panel)`
    max-width: 600px;
    height: 800px;
    padding: 16px;

    box-sizing: border-box;

    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;

    overflow: hidden auto;

    -ms-overflow-style: none;

    &::-webkit-scrollbar {
        display: none;
    }
`;

const activifyFilter = (activity: MoodleActivity) => {
    const hasEndDate = activity.endDate !== null;
    const hasEndStatus = activity.progress !== null;
    const isUnfinished = activity.progress !== 1.0;

    return hasEndDate && hasEndStatus && isUnfinished;
};

const activityToElement = (courses: MoodleCourse[]) => {
    return (activity: MoodleActivity) => {
        const course = courses.find(
            (course) => course.id === activity.courseId
        );

        return (
            <ActivityItem
                key={activity.id}
                activity={activity}
                course={course}
            />
        );
    };
};

const ActivityList = ({}) => {
    const [courses, setCourses] = useAtom(coursesAtom);
    const [activitys, setActivitys] = useAtom(activitysAtom);

    const elements = activitys
        .filter(activifyFilter)
        .sort((a, b) => a.endDate! - b.endDate!)
        .map(activityToElement(courses));

    return <Container>{elements}</Container>;
};

export default ActivityList;
