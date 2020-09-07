async function GetAttendanceData(id) {
    let req = await (await fetch("https://smartlead.hallym.ac.kr/course/view.php?id=" + id)).text();
    let doc = new DOMParser().parseFromString(req, "text/html");
    let nodeList = doc.querySelectorAll(".attendance > li");
    let attendanceList = [];

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

        attendanceList.push(data);
    }

    return attendanceList;
}

async function GetProgressData(id) {
    let req = await (
        await fetch("https://smartlead.hallym.ac.kr/report/ubcompletion/user_progress_a.php?id=" + id)
    ).text();
    let doc = new DOMParser().parseFromString(req, "text/html");
    let nodeList = doc.querySelectorAll(".user_progress_table tr");
    let progressList = [];
    let skipFirst = true;

    let week = 0;

    for (let node of nodeList) {
        let data = {
            icon: "",
            name: "",
            minimum: -1,
            value: -1,
            done: false
        };
        let childNodeList = node.querySelectorAll("td");

        if (skipFirst) {
            skipFirst = false;
            continue;
        }

        if (childNodeList.length > 4) {
            if (!childNodeList[1].classList.contains("text-left")) {
                break;
            }
            week = parseInt(childNodeList[0].textContent);
            data.icon = childNodeList[1].querySelector("img").getAttribute("src");
            data.name = childNodeList[1].textContent.trim();
            data.minimum = ParseTimeText(childNodeList[2].textContent);
            data.value = ParseTimeText(childNodeList[3].innerText.split("\n")[0]);
            data.done = childNodeList[5].textContent === "O";
        } else {
            if (!childNodeList[0].classList.contains("text-left")) {
                break;
            }
            data.icon = childNodeList[0].querySelector("img").getAttribute("src");
            data.name = childNodeList[0].textContent.trim();
            data.minimum = ParseTimeText(childNodeList[1].textContent);
            data.value = ParseTimeText(childNodeList[2].innerText.split("\n")[0]);
            data.done = childNodeList[3].textContent === "O";
        }

        data.week = week;

        progressList.push(data);
    }

    return progressList;
}

async function GetSummaryData() {
    let nodeList = document.querySelectorAll(".coursefullname");
    let dataList = [];

    for (let node of nodeList) {
        let id = parseInt(node.getAttribute("href").split("?id=")[1]);
        let name = node.textContent;
        let attendance = await GetAttendanceData(id);
        let progress = await GetProgressData(id);

        dataList.push({
            name,
            id,
            attendance,
            progress
        });
    }
    console.log(dataList);

    return dataList;
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

GetSummaryData();
