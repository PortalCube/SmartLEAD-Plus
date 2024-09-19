import styled from "styled-components";
import ActivityList from "../components/ActivityList.tsx";
import CourseList from "../components/CourseList.tsx";
import { useAtom } from "jotai";
import {
    activitysAtom,
    coursesAtom,
    modifiedDateAtom,
    sectionsAtom,
} from "../atom.ts";
import { useEffect, useState } from "react";
import classNames from "classnames";
import { loadData } from "../../librarys/dataLoader.ts";
import { useNavigate } from "react-router-dom";
import { logout } from "../../librarys/account.ts";

const Menu = styled.div`
    display: flex;
    margin-bottom: 24px;
    justify-content: center;
    align-items: center;

    padding: 12px 16px;
    border-radius: 8px;
    max-width: 640px;
    box-shadow: 0px 0px 8px #0000006f;
    background-color: #131313af;

    backdrop-filter: blur(16px);
`;

const Button = styled.button`
    width: 150px;
    height: 40px;
    margin: 0 16px;
    padding: 4px;
    border: none;
    border-radius: 0;
    border-bottom: 2px solid #ffffff2f;

    outline: none;
    background: none;

    transition:
        color 0.2s ease,
        box-shadow 0.2s ease,
        border 0.2s ease;

    box-shadow: inset 0 0 0 0 #ffffff2f;
    color: #efefef;

    cursor: pointer;

    &:hover {
        background: none;
        color: #efefef;
        box-shadow: inset 0 -40px 0 0 #ffffff2f;
    }

    &:active {
        outline: none !important;
        color: black;
        border: none;
        box-shadow: inset 0 -40px 0 0 #ffffff;
    }

    &:focus {
        outline: none;
    }

    &.selected {
        border-bottom: 2px solid #ffffff;
        box-shadow: inset 0 -40px 0 0 #ffffff;
        color: black;
    }
`;

function getActiveComponent(selectedMenu: number): JSX.Element {
    switch (selectedMenu) {
        case 1:
            return <ActivityList />;
        case 2:
            return <CourseList />;
        case 3:
            return <ActivityList />;
        default:
            return <ActivityList />;
    }
}

const MainSection = ({}) => {
    const navigate = useNavigate();

    const [courses, setCourses] = useAtom(coursesAtom);
    const [sections, setSections] = useAtom(sectionsAtom);
    const [activitys, setActivitys] = useAtom(activitysAtom);
    const [modifiedDate, setModifiedDate] = useAtom(modifiedDateAtom);

    const [selectedMenu, setSelectedMenu] = useState<number>(3);

    const summeryClass = classNames(
        { selected: selectedMenu === 1 },
        "summery-list"
    );
    const courseClass = classNames(
        { selected: selectedMenu === 2 },
        "course-list"
    );
    const todoClass = classNames({ selected: selectedMenu === 3 }, "todo-list");

    function menuSelect(id: number) {
        setSelectedMenu(id);
    }

    useEffect(() => {
        loadData().then((data) => {
            if (data) {
                setModifiedDate(data.modifiedDate);
                setCourses(data.courses);
                setSections(data.sections);
                setActivitys(data.activitys);
            } else {
                logout(navigate);
            }
        });
    }, []);

    return (
        <>
            <Menu>
                <Button className={summeryClass} onClick={() => menuSelect(1)}>
                    이번 주 활동 요약
                </Button>
                <Button className={courseClass} onClick={() => menuSelect(2)}>
                    강의실 목록
                </Button>
                <Button className={todoClass} onClick={() => menuSelect(3)}>
                    과제 목록
                </Button>
            </Menu>
            {getActiveComponent(selectedMenu)}
        </>
    );
};

export default MainSection;
