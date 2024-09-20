import styled from "styled-components";
import {
    MoodleActivity,
    getActivityIcon,
    getActivityUrl,
} from "../../librarys/activity.ts";
import dayjs from "dayjs";
import { MoodleCourse } from "../../librarys/course.ts";
import classNames from "classnames";
import { useState } from "react";
// import PropTypes from "prop-types";

const Item = styled.a`
    width: 100%;
    padding: 8px 12px;
    display: flex;
    border-radius: 4px;
    color: #efefef;
    box-sizing: border-box;

    gap: 12px;

    text-decoration: none;

    transition:
        transform 0.2s,
        background-color 0.2s;

    align-items: center;
    justify-content: space-between;

    &:hover {
        background-color: rgba(255, 255, 255, 0.1);
        text-decoration: none;
        color: #efefef;

        transform: scale(1.005);
    }
`;

const Icon = styled.img`
    width: 32px;
    height: 32px;
`;

const Info = styled.div`
    max-width: 364px;
    flex-grow: 1;

    display: flex;
    justify-content: flex-start;
    flex-direction: column;

    & > p {
        white-space: pre;
        overflow: hidden;
        text-overflow: ellipsis;
        line-height: 1.2;
    }
`;

const CourseName = styled.p`
    color: #999999;
    font-size: 12px;
    font-weight: 400;
`;

const ActivityName = styled.p`
    color: #dfdfdf;

    font-size: 16px;
    font-weight: 600;
`;

const DeadlineBadge = styled.p`
    width: 120px;
    flex-shrink: 0;
    padding: 4px 0;
    border-radius: 2px;
    display: flex;
    justify-content: right;

    font-size: 16px;
    font-weight: 600;

    &.emergency {
        background-color: #ff3434;
        box-shadow: 0px 0px 4px #ff001a;

        justify-content: center;
    }

    &.hover {
        font-size: 12px;
    }

    &.level3 {
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

const ActivityItem = ({
    activity,
    course,
}: {
    activity: MoodleActivity;
    course: MoodleCourse | undefined;
}) => {
    const [isHover, setHover] = useState(false);

    const endDate = dayjs(activity.endDate! * 1000);
    const timeLeft = dayjs().diff(endDate, "hour") * -1;

    let endDateText = `${endDate.fromNow(true)} 남음`;
    let level = 0;
    let isEmergency = timeLeft < 1; // 1시간 이내로 종료

    if (timeLeft < 0) {
        // 이미 활동이 종료됨
        level = 3;
        isEmergency = true;
        endDateText = `!!! ${endDate.fromNow(true)} 지남 !!!`;
    } else if (timeLeft < 1) {
        // 1시간 남음!

        level = 3;
        isEmergency = true;
        endDateText = `${endDate.fromNow(true)} 남음`;
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

    if (isHover) {
        endDateText = endDate.format("M월 D일 HH:mm:ss");
    }

    const badgeClass = classNames("level" + level, {
        emergency: isEmergency,
        hover: isHover,
    });

    const onMouseEnter = () => {
        setHover(true);
    };

    const onMouseLeave = () => {
        setHover(false);
    };

    return (
        <Item
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
            href={getActivityUrl(activity)}
            target="_blank"
        >
            <Icon src={getActivityIcon(activity)} alt="" />
            <Info>
                <CourseName>{course?.name}</CourseName>
                <ActivityName>{activity.name}</ActivityName>
            </Info>
            <DeadlineBadge className={badgeClass}>{endDateText}</DeadlineBadge>
        </Item>
    );
};

export default ActivityItem;
