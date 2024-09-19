import styled from "styled-components";
import Panel from "./Panel.tsx";
import { MdCheck } from "react-icons/md";
import { BASE_URL, LOGIN_URL } from "../../librarys/constant.ts";
import React, { useState } from "react";
import { apiLogin, sessionLogin } from "../../librarys/account.ts";
import { useNavigate } from "react-router-dom";
import { removeMoodleData } from "../../librarys/dataStorage.ts";

const Container = styled(Panel)`
    width: 500px;
    box-sizing: border-box;
    padding: 24px;
    display: flex;

    flex-direction: column;
    gap: 16px;
`;

const FieldGrid = styled.div`
    display: grid;
    grid-template-columns: auto 1fr;
    align-items: center;
    gap: 16px;
`;

const FieldLabel = styled.p`
    font-size: 16px;
`;

const FieldInput = styled.input`
    padding: 8px 8px;
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 4px;
    background-color: rgba(255, 255, 255, 0.05);
    color: #dfdfdf;
    font-size: 16px;
`;

const CheckGroup = styled.button`
    margin: -4px;
    padding: 4px;
    border: none;
    border-radius: 4px;
    background: none;
    display: flex;
    gap: 8px;
    color: #dfdfdf;
    cursor: pointer;
    transition: background-color 0.1s;

    &:hover {
        background-color: rgba(255, 255, 255, 0.05);
    }
`;

const CheckBox = styled.div`
    width: 16px;
    height: 16px;
    background-color: rgba(255, 255, 255, 0.2);
    color: #dfdfdf;
    border-radius: 4px;

    display: flex;
    justify-content: center;
    align-items: center;

    & > svg {
        width: 16px;
        height: 16px;
    }
`;

const Divider = styled.div`
    margin-top: 20px;
    margin-bottom: 8px;
    border-top: 2px solid rgba(255, 255, 255, 0.15);
`;

const LoginButton = styled.button`
    padding: 4px 0;
    border: none;
    border-radius: 8px;
    color: #dfdfdf;
    background-color: rgba(255, 255, 255, 0.05);

    display: flex;
    align-items: center;
    justify-content: center;

    font-weight: 800;
    font-size: 28px;

    cursor: pointer;
    transition: background-color 0.1s;

    &:hover {
        background-color: rgba(195, 56, 255, 0.25);
    }
`;

const ExternalButton = styled.a`
    margin-top: -8px;
    padding: 4px 0;
    border: none;
    border-radius: 8px;
    color: rgba(255, 255, 255, 0.5);

    display: flex;
    align-items: center;
    justify-content: center;

    align-self: center;

    font-weight: 400;
    font-size: 12px;

    cursor: pointer;
    transition: color 0.1s;

    &:hover {
        color: rgb(218, 131, 255);
    }
`;

const Login = ({}) => {
    const navigate = useNavigate();
    const [id, setId] = useState<string>("");
    const [password, setPassword] = useState<string>("");

    const externalUrl = LOGIN_URL;

    const onIdInput = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target) {
            setId(event.target.value);
        }
    };

    const onPasswordInput = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target) {
            setPassword(event.target.value);
        }
    };

    const onLoginButtonClick = async () => {
        await submitLogin();
    };

    const onInputKeyDown = async (
        event: React.KeyboardEvent<HTMLInputElement>
    ) => {
        if (event.key === "Enter") {
            await submitLogin();
        }
    };

    const submitLogin = async () => {
        if (id === "") {
            alert("아이디를 입력하세요.");
            return;
        }

        if (password === "") {
            alert("비밀번호를 입력하세요.");
            return;
        }

        // 세션 로그인
        const response = await sessionLogin(id, password);

        if (response === false) {
            alert("아이디 혹은 비밀번호를 다시 확인해주세요.");
            return;
        }

        // API 로그인
        await apiLogin(id, password, true);

        // 기존 데이터 제거
        await removeMoodleData();

        // 리다이렉션
        navigate("/dashboard");
    };

    return (
        <Container>
            <FieldGrid>
                <FieldLabel>아이디</FieldLabel>
                <FieldInput
                    type="text"
                    onInput={onIdInput}
                    onKeyDown={onInputKeyDown}
                    value={id}
                />
                <FieldLabel>비밀번호</FieldLabel>
                <FieldInput
                    type="password"
                    onInput={onPasswordInput}
                    onKeyDown={onInputKeyDown}
                    value={password}
                />
            </FieldGrid>
            {/* <CheckGroup>
                <CheckBox>
                    <MdCheck />
                </CheckBox>
                24시간 동안 로그인 유지하기
            </CheckGroup> */}
            <Divider />
            <LoginButton onClick={onLoginButtonClick}>로그인</LoginButton>
            <ExternalButton href={externalUrl}>
                SmartLEAD에서 로그인
            </ExternalButton>
        </Container>
    );
};

export default Login;
