import classNames from "classnames";
import { useEffect, useState } from "react";
import styled from "styled-components";
import Background from "./components/Background.tsx";
import { loadUserToken } from "../librarys/dataStorage.ts";
import {
    createBrowserRouter,
    Outlet,
    RouterProvider,
    useNavigate,
} from "react-router-dom";
import LoginSection from "./sections/LoginSection.tsx";
import MainSection from "./sections/MainSection.tsx";
import { checkSession, logout } from "../librarys/account.ts";

const Container = styled.div`
    max-width: 100vw;
    max-height: 100vh;
    overflow: auto;
`;

const Content = styled.div`
    margin-left: 100px;
    position: absolute;
`;

export default function App() {
    const navigate = useNavigate();

    useEffect(() => {
        checkSession()
            .then((result) => {
                if (!result) {
                    logout();
                    navigate("/login");
                }

                return loadUserToken();
            })
            .then(({ token, id }) => {
                if (token === undefined) {
                    navigate("/login");
                } else {
                    navigate("/dashboard");
                }
            });
    }, []);

    return (
        <Container>
            <Background />
            <Content>
                <Outlet />
            </Content>
        </Container>
    );
}
