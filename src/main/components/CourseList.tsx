import styled from "styled-components";
import CourseItem from "./CourseItem.tsx";
import { useEffect, useState } from "react";
import { MoodleCourse } from "../../librarys/course.ts";
import { loadData } from "../../librarys/dataLoader.ts";
import { coursesAtom, modifiedDateAtom } from "../atom.ts";
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

function getColor(value: number) {
    function sfc32(a: number, b: number, c: number, d: number) {
        return function () {
            a |= 0;
            b |= 0;
            c |= 0;
            d |= 0;
            let t = (((a + b) | 0) + d) | 0;
            d = (d + 1) | 0;
            a = b ^ (b >>> 9);
            b = (c + (c << 3)) | 0;
            c = (c << 21) | (c >>> 11);
            c = (c + t) | 0;
            return (t >>> 0) / 4294967296;
        };
    }

    value *= 234780291; // 대충 아무 숫자

    const prng = sfc32(value, value, value, value);
    const red = Math.floor(prng() * 256);
    const green = Math.floor(prng() * 256);
    const blue = Math.floor(prng() * 256);
    return `rgb(${red}, ${green}, ${blue})`;
}

const CourseList = ({}) => {
    const [courses, setCourses] = useAtom(coursesAtom);
    const [modifiedDate, setModifiedDate] = useAtom(modifiedDateAtom);

    const courseItems = courses
        .sort((a, b) => {
            // 코스 타입이 정규 타입인 경우를 먼저 보여줌
            // 그 다음에는 이름 순으로 정렬

            return a.id - b.id;
        })
        .map((course) => {
            const title = course.classDivision
                ? `${course.name}[${course.classDivision}]`
                : course.name;
            return (
                <CourseItem
                    key={course.id}
                    url={`https://smartlead.hallym.ac.kr/course/view.php?id=${course.id}`}
                    title={title}
                    subtitle={course.ownerName ?? ""}
                    color={getColor(course.id)}
                    imageUrl={course.imageUrl}
                />
            );
        });

    return <Container>{courseItems}</Container>;
};

export default CourseList;
