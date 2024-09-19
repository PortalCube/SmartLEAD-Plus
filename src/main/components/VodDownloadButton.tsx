import { useState } from "react";
import styled from "styled-components";
import { mergeVideo } from "../../librarys/mergeVideo.ts";
import classNames from "classnames";

const Container = styled.div`
    height: 100%;
    display: flex;
    align-items: center;

    font-family: "NanumGothic", Arial, Helvetica, sans-serif;
`;

const Button = styled.div`
    padding: 2px 36px;
    border: 0;
    border-radius: 16px;
    background: none;
    background-color: #ffffff;
    color: #000000;
    cursor: pointer;

    transition: background-color 0.2s;

    &:hover {
        background-color: #cccccc;
    }
`;

const Popup = styled.div`
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: #000000af;
    color: #ffffff;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 999999;

    &.disable {
        display: none;
    }
`;

const Modal = styled.div`
    padding: 16px 36px;
    border-radius: 4px;
    background-color: #ffffff3f;
    backdrop-filter: blur(8px);
`;

const ModalHeader = styled.p`
    margin: 4px 0;
    font-size: 24px;
`;

const ModalContent = styled.p`
    margin: 0;
    font-size: 12px;
`;

const VodDownloadButton = ({
    title,
    uuid,
}: {
    title: string;
    uuid: string;
}) => {
    const [completeCount, setCompleteCount] = useState(0);
    const [totalCount, setTotalCount] = useState(0);
    const [totalSize, setTotalSize] = useState(0);
    const [isDownloading, setIsDownloading] = useState(false);

    const onProgress = (count: number, total: number, size: number) => {
        setCompleteCount(count);
        setTotalCount(total);
        setTotalSize(size);
    };

    const onClick = async () => {
        setIsDownloading(true);
        await mergeVideo(title, uuid, onProgress);
        setIsDownloading(false);
    };

    const percent = ((completeCount / totalCount) * 100).toFixed(2);
    const displaySize = (totalSize / 1024 / 1024).toFixed(2);

    return (
        <Container>
            <Button onClick={onClick}>VOD 다운로드</Button>
            <Popup className={classNames({ disable: !isDownloading })}>
                <Modal>
                    <ModalHeader>VOD를 다운로드 하고 있습니다...</ModalHeader>
                    <ModalContent>
                        {completeCount}/{totalCount} ({percent}%, {displaySize}
                        MB)
                    </ModalContent>
                </Modal>
            </Popup>
        </Container>
    );
};

export default VodDownloadButton;
