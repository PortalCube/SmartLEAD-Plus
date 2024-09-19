import styled from "styled-components";
import ActivityItem from "./ActivityItem.tsx";
import { activitysAtom, coursesAtom, modifiedDateAtom } from "../atom.ts";
import { useAtom } from "jotai";

const Container = styled.div`
    max-width: 640px;
    min-height: 480px;
    padding: 12px 16px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    flex-direction: column;
    flex-wrap: wrap;
    box-sizing: content-box;
    box-shadow: 0px 0px 8px #0000006f;
    background-color: #131313af;

    backdrop-filter: blur(16px);
`;

const ActivityList = ({}) => {
    const [courses, setCourses] = useAtom(coursesAtom);
    const [activitys, setActivitys] = useAtom(activitysAtom);
    const [modifiedDate, setModifiedDate] = useAtom(modifiedDateAtom);

    const activityItems = activitys
        .filter(
            (activity) =>
                activity.endDate !== null &&
                activity.progress !== 1.0 &&
                activity.progress !== null
        )
        .sort((a, b) => a.endDate! - b.endDate!)
        .map((activity) => {
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
        });

    return <Container>{activityItems}</Container>;
};

export default ActivityList;
