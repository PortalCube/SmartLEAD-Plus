import styled from "styled-components";
import {
    MoodleActivity,
    getActivityIcon,
    getActivityUrl,
} from "../../librarys/activity.ts";
import dayjs from "dayjs";
import { MoodleCourse } from "../../librarys/course.ts";
// import PropTypes from "prop-types";

const Item = styled.a`
    display: flex;
    width: 100%;
    overflow: hidden;
    margin: 6px 0;
    padding: 8px 10px;
    border-radius: 4px;
    color: #efefef;
    box-sizing: content-box;

    gap: 4px;

    text-decoration: none;

    transition: background-color 0.2s;

    align-items: center;
    justify-content: space-between;

    &:hover {
        background-color: #0000006f;
        text-decoration: none;
        color: #efefef;
    }

    &:focus {
        text-decoration: none;
        color: #efefef;
    }

    @media (max-width: 1299px) {
        margin: 4px 0;
        padding: 6px 8px;
    }
`;

const ExpireContent = styled.div`
    display: flex;
    align-items: center;

    &.level3 {
        padding: 4px 8px;
        background-color: #ff3434;
        color: white;
    }

    &.level2 {
        color: #e97f1c;
    }

    &.level1 {
        color: #1db65d;
    }

    &.level0 {
        color: #3185d3;
    }
`;

const Icon = styled.img`
    width: 28px;
    height: 28px;
    margin-right: 12px;
`;

const TextContainer = styled.div`
    display: flex;
    justify-content: flex-start;
    text-align: left;
    flex-grow: 1;
    flex-direction: column;

    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    word-break: break-all;
    word-wrap: break-word;
`;

const Title = styled.p`
    margin: 0;
    max-width: 400px;
    font-size: 11pt;

    @media (max-width: 1299px) {
        max-width: 220px;
        font-size: 10pt;
    }
`;

const Subtitle = styled.p`
    margin: 0;
    max-width: 400px;
    font-size: 8pt;

    @media (max-width: 1299px) {
        max-width: 220px;
        font-size: 7pt;
    }
`;

const ExpireText = styled.p`
    margin: 0;
    width: 100%;
    text-align: right;
    font-size: 12pt;

    @media (max-width: 1299px) {
        font-size: 11pt;
    }
`;

const ActivityItem = ({
    activity,
    course,
}: {
    activity: MoodleActivity;
    course: MoodleCourse | undefined;
}) => {
    const endDate = dayjs(activity.endDate! * 1000);
    const timeLeft = dayjs().diff(endDate, "hour") * -1;

    let endDateText = `${endDate.fromNow(true)} 남음`;
    let level = 0;

    if (timeLeft < 0) {
        // 이미 활동이 종료됨
        level = 3;
        endDateText = `${endDate.fromNow(true)} 전에 마감`;
    } else if (timeLeft < 24) {
        // 24시간 이내로 활동 종료
        endDateText = `${timeLeft}시간 남음`;
        level = 2; // 24시간
    } else if (timeLeft < 48) {
        // 48시간 이내로 활동 종료
        endDateText = `${timeLeft}시간 남음`;
        level = 1;
    } else if (timeLeft < 24 * 7) {
        // 7일 이내로 활동 종료
        level = 1;
    }

    return (
        <Item href={getActivityUrl(activity)} target="_blank">
            <Icon src={getActivityIcon(activity)} alt="" />
            <TextContainer>
                <Title>{activity.name}</Title>
                <Subtitle>{course?.name}</Subtitle>
            </TextContainer>
            <ExpireContent className={`level${level}`}>
                <ExpireText>{endDateText}</ExpireText>
            </ExpireContent>
        </Item>
    );
};

// ActivityItem.propTypes = {
//     url: PropTypes.string.isRequired,
//     title: PropTypes.string.isRequired,
//     subtitle: PropTypes.string.isRequired,
//     color: PropTypes.string.isRequired,
// };

export default ActivityItem;
