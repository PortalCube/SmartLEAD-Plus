"use strict";

import "./style.css";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import arraySupport from "dayjs/plugin/arraySupport";
import objectSupport from "dayjs/plugin/objectSupport";
import "dayjs/locale/ko";
import _ from "lodash";

const REGEX_WEEK = /^(\d{1,2})주차 \[(\d{1,2})월(\d{1,2})일 - (\d{1,2})월(\d{1,2})일\]$/g;

const URL_MAIN = "https://smartlead.hallym.ac.kr";

const URL_ICON_VOD = URL_MAIN + "/theme/image.php/coursemosv2/vod/1599440449/icon";
const URL_ICON_ZOOM = URL_MAIN + "/theme/image.php/coursemosv2/zoom/1599440449/icon";
const URL_ICON_ASSIGN = URL_MAIN + "/theme/image.php/coursemosv2/assign/1599440449/icon";
const URL_ICON_QUIZ = URL_MAIN + "/theme/image.php/coursemosv2/quiz/1599440449/icon";

const URL_COURSE_LIST = URL_MAIN + "/local/ubion/user/";
const URL_COURSE_MAIN = URL_MAIN + "/course/view.php?id=";
const URL_ATTENDANCE_LIST = URL_MAIN + "/report/ubcompletion/user_progress_a.php?id=";
const URL_ZOOM_LIST = URL_MAIN + "/mod/zoom/index.php?id=";
const URL_ASSIGN_LIST = URL_MAIN + "/mod/assign/index.php?id=";
const URL_QUIZ_LIST = URL_MAIN + "/mod/quiz/index.php?id=";

const URL_VOD_VIEW = URL_MAIN + "/mod/vod/viewer.php?id=";
const URL_ZOOM_VIEW = URL_MAIN + "/mod/zoom/view.php?id=";
const URL_ASSIGN_VIEW = URL_MAIN + "/mod/assign/view.php?id=";
const URL_QUIZ_VIEW = URL_MAIN + "/mod/quiz/view.php?id=";

const HTML_BTNGROUP = `<button id="plus-course-all-btn" type="button">강좌 전체보기</button>
<button id="plus-course-todo-btn" type="button">할 일 목록</button>
<button id="plus-course-summary-btn" type="button">이번주 학습 요약</button>
<button id="plus-course-refresh-btn" class="plus-round-icon-btn" type="button">
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 18 18">
        <path
            d="M9 13.5c-2.49 0-4.5-2.01-4.5-4.5S6.51 4.5 9 4.5c1.24 0 2.36.52 3.17 1.33L10 8h5V3l-1.76 1.76C12.15 3.68 10.66 3 9 3 5.69 3 3.01 5.69 3.01 9S5.69 15 9 15c2.97 0 5.43-2.16 5.9-5h-1.52c-.46 2-2.24 3.5-4.38 3.5z"
        ></path>
    </svg>
</button>
<span id="plus-data-status"></span>`;
const HTML_FRAME = `<div id="{{ID}}" class="course_lists" style="display: none;">
    <ul class="smartlead_plus my-course-lists coursemos-layout-0">
    </ul>
</div>`;
const HTML_SUMMARY = `<li class="course_label_re_03">
    <div class="course_box">
        <a href="https://smartlead.hallym.ac.kr/course/view.php?id={{ID}}" class="course_link">
            <div class="plus-course-top">
                <div class="course-name">
                    <div class="course-title">
                        <p class="plus-course-name">{{NAME}}</p>
                    </div>
                </div>
                <div class="plus-course-percent">
                    <p class="plus-course-percent-text level{{LEVEL}}">{{PERCENT}}</p>
                </div>
            </div>
            <div class="plus-course-progress">
                <div class="plus-progress-back">
                    <div class="plus-progress-front" style="width: {{PROGRESS}};"></div>
                </div>
            </div>
        </a>
    </div>
</li>
`;
const HTML_TODO = `<li class="course_label_re_03">
    <div class="course_box">
        <a href="{{URL}}" class="course_link" target="_blank">
            <div class="plus-course-top">
                <div class="course-name">
                    <div class="course-title">
                        <p class="plus-course-name">
                            <img
                                class="plus-todo-icon"
                                src="{{ICON}}"
                                alt="{{ICON_ALT}}"
                            />{{NAME}}<span class="prof">{{COURSENAME}}</span>
                        </p>
                    </div>
                </div>
                <div class="plus-course-percent-text level{{LEVEL}}">
                    <span class="plus-course-todo-sub">{{SUB}}</span>
                    <span class="plus-course-todo-main">{{MAIN}}</span>
                </div>
            </div>
        </a>
    </div>
</li>`;
const HTML_ACT_INFO = `<span class="displayoptions"
><span class="text-ubstrap">&nbsp;{{STATUS}}&nbsp;<span class="text-late">{{PROGRESS}}</span></span
><span class="text-info">&nbsp;{{DATE}}</span></span
>`;

let course_year = dayjs().year();
let course_week = 0;
let course_data = {
    data: [],
    isUpdating: false,
    lastUpdate: null
};

async function ScrapCoursePage(id) {
    let req = await (await fetch(URL_COURSE_MAIN + id)).text();
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
        let actNodeList = weekNode.querySelectorAll(
            ".total_sections .activity:not(.label)"
        );

        REGEX_WEEK.lastIndex = 0;

        let weekText = weekNode.getAttribute("aria-label");
        // console.log(weekNode);

        if (REGEX_WEEK.test(weekText) === false) {
            continue;
        }

        REGEX_WEEK.lastIndex = 0;

        let weekRegex = REGEX_WEEK.exec(weekText);
        let weekData = {
            week: parseInt(weekRegex[1]),
            start: dayjs([
                course_year,
                parseInt(weekRegex[2]) - 1,
                parseInt(weekRegex[3]),
                0,
                0,
                0,
                0
            ]).format(),
            end: dayjs([
                course_year,
                parseInt(weekRegex[4]) - 1,
                parseInt(weekRegex[5]),
                23,
                59,
                59,
                0
            ]).format()
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
                    let dateText = node
                        .querySelector(".text-ubstrap")
                        .firstChild.textContent.trim();
                    let dateArray = dateText.split(" ~ ");
                    data.schedule = {
                        start: dayjs(dateArray[0]).format(),
                        end: dayjs(dateArray[1]).format()
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
    let req = await (await fetch(URL_ZOOM_LIST + id)).text();
    let doc = new DOMParser().parseFromString(req, "text/html");
    let nodeList = doc.querySelectorAll(".meeting-list tbody:not(.empty) tr");
    let result = [];

    for (let node of nodeList) {
        let cellList = node.querySelectorAll("td");

        REGEX_WEEK.lastIndex = 0;

        let dateRegex = REGEX_WEEK.exec(cellList[0].textContent);
        let data = {
            id: parseInt(
                cellList[1].querySelector("a").getAttribute("href").split("?id=")[1]
            ),
            week: parseInt(dateRegex[1]),
            name: cellList[1].textContent,
            date: dayjs(cellList[2].textContent).format()
        };

        result.push(data);
    }

    return result;
}

async function ScrapAssignPage(id) {
    let req = await (await fetch(URL_ASSIGN_LIST + id)).text();
    let doc = new DOMParser().parseFromString(req, "text/html");
    let nodeList = doc.querySelectorAll("table tbody:not(.empty) tr[class]");
    let result = [];

    let dateRegex;

    for (let node of nodeList) {
        let cellList = node.querySelectorAll("td");

        if (cellList[0].textContent) {
            REGEX_WEEK.lastIndex = 0;
            dateRegex = REGEX_WEEK.exec(cellList[0].textContent);
        }

        let data = {
            id: parseInt(
                cellList[1].querySelector("a").getAttribute("href").split("?id=")[1]
            ),
            week: parseInt(dateRegex[1]),
            name: cellList[1].textContent,
            date: dayjs(cellList[2].textContent).format(),
            complete: cellList[3].textContent === "제출 완료"
        };

        result.push(data);
    }

    return result;
}

async function ScrapQuizPage(id) {
    let req = await (await fetch(URL_QUIZ_LIST + id)).text();
    let doc = new DOMParser().parseFromString(req, "text/html");
    let nodeList = doc.querySelectorAll("table tbody:not(.empty) tr[class]");
    let result = [];

    let week = 0;

    for (let node of nodeList) {
        let cellList = node.querySelectorAll("td");

        REGEX_WEEK.lastIndex = 0;

        let dateRegex = REGEX_WEEK.exec(cellList[0].textContent);

        let data = {
            id: parseInt(
                cellList[1].querySelector("a").getAttribute("href").split("?id=")[1]
            ),
            week: 0,
            name: cellList[1].textContent
        };

        if (dateRegex) {
            week = parseInt(dateRegex[1]);
        }

        data.week = week;

        if (cellList.length == 4) {
            data.date = dayjs(cellList[2].textContent).format();
        }

        result.push(data);
    }

    return result;
}

async function ScrapProgressPage(id) {
    let req = await (await fetch(URL_ATTENDANCE_LIST + id)).text();
    let doc = new DOMParser().parseFromString(req, "text/html");
    let nodeList = doc.querySelectorAll(".user_progress_table tr");
    let result = {
        vod_status: [],
        week_status: []
    };
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
            week = parseInt(childNodeList[0].textContent);

            result.week_status.push({
                week: week,
                complete: childNodeList[5].firstChild.textContent.trim() === "O"
            });

            if (!childNodeList[1].classList.contains("text-left")) {
                continue;
            }
            data.name = childNodeList[1].textContent.trim();
            data.time.require = TextToTime(childNodeList[2].textContent);
            data.time.value = TextToTime(childNodeList[3].firstChild.textContent.trim());
            data.complete = childNodeList[4].textContent === "O";
        } else {
            if (!childNodeList[0].classList.contains("text-left")) {
                continue;
            }
            data.name = childNodeList[0].textContent.trim();
            data.time.require = TextToTime(childNodeList[1].textContent);
            data.time.value = TextToTime(childNodeList[2].firstChild.textContent.trim());
            data.complete = childNodeList[3].textContent === "O";
        }

        data.week = week;

        result.vod_status.push(data);
    }

    return result;
}

async function ScrapListPage() {
    let req = await (await fetch(URL_COURSE_LIST)).text();
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

async function UpdateData() {
    if (course_data.isUpdating) {
        return;
    }

    course_data.isUpdating = true;
    StatusText();

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
            let item, week_item;
            switch (act.type) {
                case 1: // 동영상 VOD
                    item = _.find(progress.vod_status, { name: act.name });
                    week_item = _.find(progress.week_status, { week: act.week });

                    if (item) {
                        act.complete = item.complete;
                        act.vod_status = item.time;
                        act.progress = _.min([
                            100,
                            Math.round((item.time.value / item.time.require) * 100)
                        ]);
                    } else if (week_item) {
                        act.complete = week_item.complete;
                        act.vod_status = {
                            require: 0,
                            value: 0
                        };
                        act.progress = week_item.complete ? 100 : 0;
                    } else {
                        act.complete = false;
                        act.vod_status = {
                            require: 0,
                            value: 0
                        };
                        act.progress = 0;
                    }

                    break;
                case 2: // ZOOM 화상 강의
                    item = _.find(zoom, { id: act.id });
                    act.schedule = {
                        start: null,
                        end: item.date
                    };
                    act.complete = dayjs(item.date) < dayjs();
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
                    act.complete = dayjs(item.date) < dayjs();
                    break;
            }

            if (act.schedule.end === undefined) {
                // 마감 기한을 정하지 않은 경우.. 활동 주차의 마지막 날을 마감 기한으로 설정
                let weekInfo = _.find(data.week, { week: act.week });
                act.schedule.end = weekInfo.end;
            }

            act.course_id = course.id;
            act.course_name = course.name;
        }

        data.name = course.name;
        data.id = course.id;

        result.push(data);
    }

    console.log(result);

    course_data.data = result;
    course_data.isUpdating = false;
    course_data.lastUpdate = dayjs().format();

    await chrome.storage.local.set({ course_data_v1: course_data });

    StatusText();
    ConstructContent();
}

function StatusText() {
    let text = "";

    if (course_data.lastUpdate) {
        text =
            "마지막 데이터 갱신: " +
            dayjs(course_data.lastUpdate).format("YYYY.MM.DD HH:mm:ss");
    }

    if (course_data.isUpdating) {
        text = text + " (갱신 중...)";
    }

    document.querySelector("#plus-data-status").textContent = text;
}

function TextToTime(time) {
    let array = time.split(":");

    let hr = 0;
    let min = 0;
    let sec = 0;

    if (array.length < 2) {
        return 0;
    } else if (array.length === 2) {
        min = parseInt(array[0]);
        sec = parseInt(array[1]);
    } else {
        hr = parseInt(array[0]);
        min = parseInt(array[1]);
        sec = parseInt(array[2]);
    }

    return hr * 60 * 60 + min * 60 + sec;
}

function TimeToText(time) {
    let min = Math.floor(time / 60);
    let sec = time - min * 60;
    let hr = Math.floor(min / 60);
    min -= hr * 60;
    if (hr !== 0) {
        return `${PadLeft(hr, 2)}:${PadLeft(min, 2)}:${PadLeft(sec, 2)}`;
    } else {
        return `${PadLeft(min, 2)}:${PadLeft(sec, 2)}`;
    }
}

function PadLeft(number, count) {
    let length = number.toString().length;
    let result = "";
    for (let i = 0; i < count - length; i++) {
        result += "0";
    }
    return result + number;
}

function ConstructContent() {
    if (course_data.isUpdating || course_data.lastUpdate === null) {
        return;
    }

    let now = dayjs();

    for (let item of course_data.data[0].week) {
        if (dayjs(item.start) < now && now < dayjs(item.end)) {
            course_week = item.week;
        }
    }

    let targetNode;

    // Construct TODO
    targetNode = document.querySelector("#course-todo .my-course-lists");
    let todoList = [];

    targetNode.innerHTML = "";

    for (let course of course_data.data) {
        for (let act of course.act) {
            let endTime = dayjs(act.schedule.end);

            if (!act.complete && endTime > now) {
                todoList.push(act);
            }
        }
    }

    todoList = _.sortBy(todoList, function (o) {
        return dayjs(o.schedule.end);
    });

    for (let item of todoList) {
        let node = HTML_TODO.replace("{{NAME}}", item.name);
        node = node.replace("{{COURSENAME}}", item.course_name);

        switch (item.type) {
            case 1: // 동영상 VOD
                node = node.replace("{{URL}}", URL_VOD_VIEW + item.id);
                node = node.replace("{{ICON}}", URL_ICON_VOD);
                node = node.replace("{{ICON_ALT}}", "동영상");
                break;
            case 2: // ZOOM 화상 강의
                node = node.replace("{{URL}}", URL_ZOOM_VIEW + item.id);
                node = node.replace("{{ICON}}", URL_ICON_ZOOM);
                node = node.replace("{{ICON_ALT}}", "화상강의");
                break;
            case 3: // 과제
                node = node.replace("{{URL}}", URL_ASSIGN_VIEW + item.id);
                node = node.replace("{{ICON}}", URL_ICON_ASSIGN);
                node = node.replace("{{ICON_ALT}}", "과제");
                break;
            case 4: // 퀴즈
                node = node.replace("{{URL}}", URL_QUIZ_VIEW + item.id);
                node = node.replace("{{ICON}}", URL_ICON_QUIZ);
                node = node.replace("{{ICON_ALT}}", "퀴즈");
                break;
        }

        let timeLeft = (dayjs(item.schedule.end) - now) / 3600000; // 1시간 단위
        if (timeLeft < 24) {
            // 1일
            node = node.replace("{{LEVEL}}", 1);
        } else if (timeLeft < 72) {
            // 72시간 (3일)
            node = node.replace("{{LEVEL}}", 2);
        } else if (timeLeft < 120) {
            // 72시간 (5일)
            node = node.replace("{{LEVEL}}", 3);
        } else {
            node = node.replace("{{LEVEL}}", 4);
        }

        node = node.replace(
            "{{SUB}}",
            `기한: ${dayjs(item.schedule.end).format("MM.DD HH:mm")}`
        );

        node = node.replace(
            "{{MAIN}}",
            now.from(dayjs(item.schedule.end), true) + " 남음"
        );

        targetNode.innerHTML += node;
    }

    // Construct Summary
    targetNode = document.querySelector("#course-summary .my-course-lists");
    let summaryList = [];

    targetNode.innerHTML = "";

    for (let course of course_data.data) {
        summaryList.push({
            id: course.id,
            name: course.name,
            complete: _.filter(course.act, { complete: true, week: course_week }).length,
            total: _.filter(course.act, { week: course_week }).length
        });
    }

    for (let item of summaryList) {
        let node = HTML_SUMMARY.replace("{{NAME}}", item.name);
        if (item.total === 0) {
            item.percent = 100;
        } else {
            item.percent = Math.round((item.complete / item.total) * 100);
        }

        node = node.replace("{{ID}}", item.id);

        if (item.percent < 25) {
            node = node.replace("{{LEVEL}}", 1);
        } else if (item.percent < 50) {
            node = node.replace("{{LEVEL}}", 2);
        } else if (item.percent < 100) {
            node = node.replace("{{LEVEL}}", 3);
        } else {
            node = node.replace("{{LEVEL}}", 4);
        }

        node = node.replace(
            "{{PERCENT}}",
            `${item.percent}% (${item.complete}/${item.total})`
        );
        node = node.replace("{{PROGRESS}}", item.percent + "%");

        targetNode.innerHTML += node;
    }
}

function LoadContent(target) {
    for (let id of ["course-all", "course-todo", "course-summary"]) {
        if (id === target) {
            document.querySelector("#" + id).setAttribute("style", "");
        } else {
            document.querySelector("#" + id).setAttribute("style", "display: none;");
        }
    }
}

function MainInit() {
    let buttonGroup = document.querySelector(".course_list_btn_group");
    buttonGroup.innerHTML = HTML_BTNGROUP;

    document.querySelector(".course_lists").setAttribute("id", "course-all");

    for (let id of ["course-todo", "course-summary"]) {
        let html = HTML_FRAME.replace("{{ID}}", id);
        document.querySelector(".progress_courses").innerHTML += html;
    }

    document.querySelector("#plus-course-all-btn").onclick = function () {
        LoadContent("course-all");
    };

    document.querySelector("#plus-course-todo-btn").onclick = function () {
        LoadContent("course-todo");
    };

    document.querySelector("#plus-course-summary-btn").onclick = function () {
        LoadContent("course-summary");
    };

    document.querySelector("#plus-course-refresh-btn").onclick = function () {
        UpdateData();
    };

    ConstructContent();

    // 데이터가 없거나 마지막 갱신 이후로 5분이 지나면 업데이트
    if (
        course_data.lastUpdate === null ||
        dayjs() - dayjs(course_data.lastUpdate) >= 1000 * 60 * 5
    ) {
        UpdateData();
    } else {
        StatusText();
    }
}

function CourseInit() {
    if (course_data.lastUpdate === null) {
        return;
    }

    let urlParams = new URLSearchParams(window.location.search);
    let course_id = parseInt(urlParams.get("id"));
    let course = _.find(course_data.data, { id: course_id });

    if (!course) {
        return;
    }

    // 각 활동에 마감 기한, 진행 상태 표기
    let nodeList = document.querySelectorAll(".activity:not(.label)");
    for (let node of nodeList) {
        let html = HTML_ACT_INFO;
        let id = parseInt(node.getAttribute("id").split("-")[1]);
        let act = _.find(course.act, { id });

        if (!act) {
            continue;
        }

        html = html.replace("{{STATUS}}", (act.complete ? "" : "미") + "완료");

        if (act.type === 1) {
            html = html.replace(
                "{{PROGRESS}}",
                `${TimeToText(act.vod_status.value)}/${TimeToText(
                    act.vod_status.require
                )} (${act.progress}%)`
            );
        } else {
            html = html.replace("{{PROGRESS}}", `(${act.complete ? 100 : 0}%)`);
        }

        html = html.replace(
            "{{DATE}}",
            `기한: ${dayjs(act.schedule.end).format("YYYY.MM.DD HH:mm")}`
        );

        if (node.querySelector(".displayoptions")) {
            // 기존 텍스트는 삭제.
            node.querySelector(".displayoptions").remove();
        }

        node.querySelector(".activityinstance").innerHTML += html;
    }
}

(async function () {
    // DayJS 플러그인 삽입 및 언어 설정
    // TODO: 스마트리드가 지원하는 모든 언어들의 지원 추가하기 (영어, 일본어, ...)
    dayjs.extend(relativeTime);
    dayjs.extend(arraySupport);
    dayjs.extend(objectSupport);
    dayjs.locale("ko");

    let storageData = await chrome.storage.local.get(["course_data_v1"]);

    if (storageData["course_data_v1"]) {
        course_data = storageData["course_data_v1"];
    }

    console.log(course_data);

    switch (location.pathname) {
        case "/": // 메인 페이지
            MainInit();
            break;
        case "/course/view.php": // 강좌 메인 페이지
            CourseInit();
            break;
    }
})();
