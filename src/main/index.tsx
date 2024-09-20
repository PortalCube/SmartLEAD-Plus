import ReactDOM from "react-dom/client";

import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import arraySupport from "dayjs/plugin/arraySupport";
import objectSupport from "dayjs/plugin/objectSupport";
import "dayjs/locale/ko";

import "./style.scss";
import App from "./App.tsx";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import LoginSection from "./sections/LoginSection.tsx";
import MainSection from "./sections/MainSection.tsx";

// dayjs 플러그인 및 로케일 적용
dayjs.extend(relativeTime);
dayjs.extend(arraySupport);
dayjs.extend(objectSupport);
dayjs.locale("ko");

const router = createMemoryRouter([
    {
        path: "/",
        element: <App />,
        children: [
            {
                path: "/login",
                element: <LoginSection />,
            },
            {
                path: "/dashboard",
                element: <MainSection />,
            },
        ],
    },
]);

const root = document.getElementById("root");
if (root) {
    ReactDOM.createRoot(root).render(<RouterProvider router={router} />);
}
