import classNames from "classnames";
import { useEffect, useRef, useState } from "react";
import styled from "styled-components";
import { useDynamicTextResize } from "../../hooks/useDynamicTextResize.ts";
// import PropTypes from "prop-types";

const Item = styled.a`
    display: flex;
    width: 100%;
    padding: 6px 8px;
    border-radius: 4px;
    color: white;
    box-sizing: border-box;

    gap: 8px;

    transition:
        transform 0.2s,
        background-color 0.2s;

    align-items: center;
    justify-content: space-between;

    text-decoration: none;

    &:hover {
        transform: scale(1.005);
        background-color: rgba(255, 255, 255, 0.1);
        color: white;
    }

    &:focus {
        text-decoration: none;
        color: white;
    }

    @media (max-width: 1299px) {
        padding: 4px 8px;
    }
`;

const Title = styled.div`
    height: 100%;
    padding-left: 4px;
    display: flex;
    align-items: center;
    overflow: hidden;
    white-space: pre;
    flex-grow: 1;

    line-height: 1.2;

    &.new-line {
        white-space: pre-line;
        word-break: keep-all;
        text-wrap: pretty;
    }

    @media (max-width: 1299px) {
        max-width: 500px;
        font-size: 11pt;
    }
`;

const Subtitle = styled.div`
    min-width: 160px;
    display: block;
    text-align: right;
    overflow: hidden;
    white-space: pre;

    line-height: 1.2;

    &.new-line {
        white-space: pre-line;
    }

    @media (max-width: 1299px) {
        font-size: 10pt;
    }
`;

const Icon = styled.img`
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background-color: #ffffff;
    flex-shrink: 0;

    &:not(.visible) {
        visibility: hidden;
    }
`;

const TITLE_MIN_SIZE = 12;
const SUBTITLE_MIN_SIZE = 11;

const CourseItem = ({
    url,
    title,
    subtitle,
    color,
    imageUrl,
}: {
    url: string;
    title: string;
    subtitle: string;
    color: string;
    imageUrl: string | null;
}) => {
    const [titleRef, titleSize] = useDynamicTextResize(
        title,
        16,
        TITLE_MIN_SIZE
    );
    const [subtitleRef, subtitleSize] = useDynamicTextResize(
        subtitle,
        14,
        SUBTITLE_MIN_SIZE
    );

    return (
        <Item href={url} target="_blank">
            <Icon
                src={imageUrl ?? ""}
                className={classNames({ visible: imageUrl })}
            />
            <Title
                ref={titleRef as React.RefObject<HTMLDivElement>}
                style={{ fontSize: `${titleSize}px` }}
                className={classNames({
                    "new-line": titleSize <= TITLE_MIN_SIZE,
                })}
            >
                {title}
            </Title>
            {/* <Subtitle
                ref={subtitleRef}
                style={{ fontSize: `${subtitleSize}px` }}
                className={classNames({
                    "new-line": subtitleSize <= SUBTITLE_MIN_SIZE,
                })}
            >
                {subtitle}
            </Subtitle> */}
        </Item>
    );
};

export default CourseItem;
