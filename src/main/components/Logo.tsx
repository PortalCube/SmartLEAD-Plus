import styled from "styled-components";
import Panel from "./Panel.tsx";
import { MdCheck } from "react-icons/md";

const Container = styled.div`
    margin-top: 180px;
    margin-bottom: 64px;
    display: flex;
    align-items: center;
    line-height: 64px;
    gap: 16px;

    color: #8097ff;

    font-family: "GangwonEduPower", Arial, Helvetica, sans-serif;
    font-weight: 800;
    font-size: 64px;
`;

const Logo = ({}) => {
    return (
        <Container>
            <p>SmartLEAD+</p>
            {/* <p>🌸</p>
            <p>Blossom</p> */}
        </Container>
    );
};

export default Logo;
