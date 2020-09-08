// ==UserScript==
// @name         SmartLEAD+
// @namespace    https://github.com/PortalCube/
// @version      0.1.0
// @description  한림대학교의 LMS, SmartLEAD를 더욱 Smart하게 만들어주는 확장스크립트입니다.
// @author       PortalCube@hallym
// @match        https://smartlead.hallym.ac.kr/*
// @require      https://cdn.jsdelivr.net/npm/lodash@4.17.20/lodash.min.js
// @grant        none
// ==/UserScript==
("use strict");

const REGEX_WEEK = /^(\d{1,2})주차 \[(\d{1,2})월(\d{1,2})일 - (\d{1,2})월(\d{1,2})일\]$/g;

const ICON_VOD = "https://smartlead.hallym.ac.kr/theme/image.php/coursemosv2/vod/1599440449/icon";
const ICON_ZOOM = "https://smartlead.hallym.ac.kr/theme/image.php/coursemosv2/zoom/1599440449/icon";
const ICON_ASSIGN = "https://smartlead.hallym.ac.kr/theme/image.php/coursemosv2/assign/1599440449/icon";
const ICON_QUIZ = "https://smartlead.hallym.ac.kr/theme/image.php/coursemosv2/quiz/1599440449/icon";

let course_year = new Date().getFullYear;

async function ScrapCoursePage(id) {
    let req = await (await fetch("https://smartlead.hallym.ac.kr/course/view.php?id=" + id)).text();
    let doc = new DOMParser().parseFromString(req, "text/html");
    let nodeList = doc.querySelectorAll(".attendance > li");
    let result = {
        attendance: [],
        act: [],
        week: []
    };

    // 출결 정보 체크
    for (let node of nodeList) {
        let data = {
            week: -1,
            status: -1
        };

        data.week = parseInt(node.querySelector(".sname").getAttribute("data-target"));

        if (node.classList.contains("inactive")) {
            data.status = 0;
        } else if (node.classList.contains("name_text0")) {
            data.status = 1;
        } else if (node.classList.contains("name_text1")) {
            data.status = 2;
        } else if (node.classList.contains("name_text2")) {
            data.status = 3;
        }

        result.attendance.push(data);
    }

    nodeList = doc.querySelectorAll(".total_sections .weeks li.section");

    // 강의 활동 정보 체크 및 각 주차별 기간 체크
    for (let weekNode of nodeList) {
        let actNodeList = weekNode.querySelectorAll(".total_sections .activity:not(.label):not(.ubfile)");

        REGEX_WEEK.lastIndex = 0;

        let weekText = weekNode.getAttribute("aria-label");
        let weekRegex = REGEX_WEEK.exec(weekText);
        let weekData = {
            week: parseInt(weekRegex[1]),
            start: new Date(course_year, parseInt(weekRegex[2]) - 1, parseInt(weekRegex[3])),
            end: new Date(course_year, parseInt(weekRegex[4]) - 1, parseInt(weekRegex[5]))
        };

        result.week.push(weekData);

        for (let node of actNodeList) {
            if (node.querySelector(".dimmed")) {
                continue;
            }

            let data = {
                id: parseInt(node.getAttribute("id").split("-")[1]),
                week: weekData.week,
                type: 0,
                name: node.querySelector(".instancename").firstChild.textContent.trim()
            };

            if (node.classList.contains("vod")) {
                data.type = 1;
                if (node.querySelector(".text-ubstrap")) {
                    let dateText = node.querySelector(".text-ubstrap").firstChild.textContent.trim();
                    let dateArray = dateText.split(" ~ ");
                    data.schedule = {
                        start: new Date(dateArray[0]),
                        end: new Date(dateArray[1])
                    };
                } else {
                    data.schedule = {
                        start: null,
                        end: undefined
                    };
                }
            } else if (node.classList.contains("zoom")) {
                data.type = 2;
            } else if (node.classList.contains("assign")) {
                data.type = 3;
            } else if (node.classList.contains("quiz")) {
                data.type = 4;
            } else {
                continue;
            }

            result.act.push(data);
        }
    }

    return result;
}

async function ScrapZoomPage(id) {
    let req = await (await fetch("https://smartlead.hallym.ac.kr/mod/zoom/index.php?id=" + id)).text();
    let doc = new DOMParser().parseFromString(req, "text/html");
    let nodeList = doc.querySelectorAll(".meeting-list tbody:not(.empty) tr");
    let result = [];

    for (let node of nodeList) {
        let cellList = node.querySelectorAll("td");

        REGEX_WEEK.lastIndex = 0;

        let dateRegex = REGEX_WEEK.exec(cellList[0].textContent);
        let data = {
            id: parseInt(cellList[1].querySelector("a").getAttribute("href").split("?id=")[1]),
            week: parseInt(dateRegex[1]),
            name: cellList[1].textContent,
            date: new Date(cellList[2].textContent)
        };

        result.push(data);
    }

    return result;
}

async function ScrapAssignPage(id) {
    let req = await (await fetch("https://smartlead.hallym.ac.kr/mod/assign/index.php?id=" + id)).text();
    let doc = new DOMParser().parseFromString(req, "text/html");
    let nodeList = doc.querySelectorAll("table tbody:not(.empty) tr[class]");
    let result = [];

    for (let node of nodeList) {
        let cellList = node.querySelectorAll("td");

        REGEX_WEEK.lastIndex = 0;

        let dateRegex = REGEX_WEEK.exec(cellList[0].textContent);
        let data = {
            id: parseInt(cellList[1].querySelector("a").getAttribute("href").split("?id=")[1]),
            week: parseInt(dateRegex[1]),
            name: cellList[1].textContent,
            date: new Date(cellList[2].textContent),
            complete: cellList[3].textContent === "제출 완료"
        };

        result.push(data);
    }

    return result;
}

async function ScrapQuizPage(id) {
    let req = await (await fetch("https://smartlead.hallym.ac.kr/mod/quiz/index.php?id=" + id)).text();
    let doc = new DOMParser().parseFromString(req, "text/html");
    let nodeList = doc.querySelectorAll("table tbody:not(.empty) tr[class]");
    let result = [];

    for (let node of nodeList) {
        let cellList = node.querySelectorAll("td");

        REGEX_WEEK.lastIndex = 0;

        let dateRegex = REGEX_WEEK.exec(cellList[0].textContent);
        let data = {
            id: parseInt(cellList[1].querySelector("a").getAttribute("href").split("?id=")[1]),
            week: parseInt(dateRegex[1]),
            name: cellList[1].textContent
        };

        if (cellList.length == 4) {
            data.date = new Date(cellList[2].textContent);
        }

        result.push(data);
    }

    return result;
}

async function ScrapProgressPage(id) {
    let req = await (
        await fetch("https://smartlead.hallym.ac.kr/report/ubcompletion/user_progress_a.php?id=" + id)
    ).text();
    let doc = new DOMParser().parseFromString(req, "text/html");
    let nodeList = doc.querySelectorAll(".user_progress_table tr");
    let result = [];
    let skipFirst = true;

    let week = 0;

    for (let node of nodeList) {
        let data = {
            name: "",
            time: {
                require: -1,
                value: -1
            },
            complete: false
        };
        let childNodeList = node.querySelectorAll("td");

        if (skipFirst) {
            skipFirst = false;
            continue;
        }

        if (childNodeList.length > 4) {
            if (!childNodeList[1].classList.contains("text-left")) {
                continue;
            }
            week = parseInt(childNodeList[0].textContent);
            data.name = childNodeList[1].textContent.trim();
            data.time.require = ParseTimeText(childNodeList[2].textContent);
            data.time.value = ParseTimeText(childNodeList[3].innerText.split("\n")[0]);
            data.complete = childNodeList[5].textContent === "O";
        } else {
            if (!childNodeList[0].classList.contains("text-left")) {
                continue;
            }
            data.name = childNodeList[0].textContent.trim();
            data.time.require = ParseTimeText(childNodeList[1].textContent);
            data.time.value = ParseTimeText(childNodeList[2].innerText.split("\n")[0]);
            data.complete = childNodeList[3].textContent === "O";
        }

        data.week = week;

        result.push(data);
    }

    return result;
}

async function ScrapListPage() {
    let req = await (await fetch("https://smartlead.hallym.ac.kr/local/ubion/user/")).text();
    let doc = new DOMParser().parseFromString(req, "text/html");
    let nodeList = doc.querySelectorAll(".coursefullname");
    let result = [];

    course_year = parseInt(doc.querySelector(".form-group #year").value);

    for (let node of nodeList) {
        let id = parseInt(node.getAttribute("href").split("?id=")[1]);
        let name = node.textContent;
        result.push({
            name,
            id
        });
    }

    return result;
}

async function ScrapData() {
    let courseList = await ScrapListPage();
    let result = [];

    for (let course of courseList) {
        let data = await ScrapCoursePage(course.id);
        let progress = await ScrapProgressPage(course.id);
        let zoom = await ScrapZoomPage(course.id);
        let assign = await ScrapAssignPage(course.id);
        let quiz = await ScrapQuizPage(course.id);

        // 각각의 페이지에서 가져온 데이터들을 merge
        for (let act of data.act) {
            let item;
            switch (act.type) {
                case 1: // 동영상 VOD
                    item = _.find(progress, { name: act.name });
                    act.complete = item.complete;
                    if (item.done) {
                        act.progress = 100;
                    } else {
                        act.progress = Math.round((item.time.value / item.time.require) * 100);
                    }
                    break;
                case 2: // ZOOM 화상 강의
                    item = _.find(zoom, { id: act.id });
                    act.schedule = {
                        start: null,
                        end: item.date
                    };
                    act.complete = item.date < new Date();
                    break;
                case 3: // 과제
                    item = _.find(assign, { id: act.id });
                    act.schedule = {
                        start: null,
                        end: item.date
                    };
                    act.complete = item.complete;
                    break;
                case 4: // 퀴즈
                    item = _.find(quiz, { id: act.id });
                    act.schedule = {
                        start: null,
                        end: item.date
                    };
                    act.complete = item.date < new Date();
                    break;
            }

            if (act.schedule.end === undefined) {
                // 마감 기한을 정하지 않은 경우.. 활동 주차의 마지막 날을 마감 기한으로 설정
                let weekInfo = _.find(data.week, { week: act.week });
                act.schedule.end = weekInfo.end;
            }
        }

        data.name = course.name;
        data.id = course.id;

        result.push(data);
    }

    return result;
}


function ParseTimeText(time) {
    let array = time.split(":");

    if (array.length < 2) {
        return 0;
    }

    let min = parseInt(array[0]);
    let sec = parseInt(array[1]);
    return min * 60 + sec;
}