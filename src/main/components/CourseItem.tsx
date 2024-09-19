import classNames from "classnames";
import { useEffect, useRef, useState } from "react";
import styled from "styled-components";
// import PropTypes from "prop-types";

const Item = styled.a`
    display: flex;
    width: 100%;
    margin: 4px 0;
    padding: 8px 10px;
    border-radius: 4px;
    // background-color: #ffffff1f;
    color: white;

    gap: 8px;

    transition:
        transform 0.2s,
        background-color 0.2s;

    align-items: center;
    justify-content: space-between;

    text-decoration: none;

    &:hover {
        transform: scale(1.01);
        background-color: #0000006f;
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

const Decoration = styled.div<{ $color: string }>`
    width: 18px;
    height: 18px;
    border-radius: 4px;
    background-color: ${(props) => props.$color};
    flex-shrink: 0;
`;

const Title = styled.div`
    height: 100%;
    padding-left: 4px;
    display: flex;
    align-items: center;
    overflow: hidden;
    white-space: pre;
    flex-grow: 1;

    &.new-line {
        white-space: pre-line;
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

    line-height: 24px;

    &.new-line {
        white-space: pre-line;
    }

    @media (max-width: 1299px) {
        font-size: 10pt;
    }
`;

const Icon = styled.img`
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background-color: #ffffff;
    flex-shrink: 0;

    &:not(.visible) {
        visibility: hidden;
    }
`;

const TITLE_MIN_SIZE = 13;
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
    const titleRef = useRef<HTMLDivElement>(null);
    const subtitleRef = useRef<HTMLDivElement>(null);
    const [titleSize, setTitleSize] = useState<number>(18);
    const [subtitleSize, setSubtitleSize] = useState<number>(14);

    useEffect(() => {
        if (subtitleRef && subtitleRef.current) {
            if (
                subtitleSize > SUBTITLE_MIN_SIZE &&
                subtitleRef.current.scrollWidth >
                    subtitleRef.current.clientWidth
            ) {
                setSubtitleSize((size) => size - 1);
            }
        }

        if (titleRef && titleRef.current) {
            if (
                titleSize > TITLE_MIN_SIZE &&
                titleRef.current.scrollWidth > titleRef.current.clientWidth
            ) {
                setTitleSize((size) => size - 1);
            }
        }
    }, [titleRef, subtitleRef, title, subtitle, titleSize, subtitleSize]);

    return (
        <Item href={url} target="_blank">
            <Decoration $color={color} />
            <Title
                ref={titleRef}
                style={{ fontSize: `${titleSize}px` }}
                className={classNames({
                    "new-line": titleSize <= TITLE_MIN_SIZE,
                })}
            >
                {title}
            </Title>
            <Subtitle
                ref={subtitleRef}
                style={{ fontSize: `${subtitleSize}px` }}
                className={classNames({
                    "new-line": subtitleSize <= SUBTITLE_MIN_SIZE,
                })}
            >
                {subtitle}
            </Subtitle>
            <Icon
                src={imageUrl ?? ""}
                className={classNames({ visible: imageUrl })}
            />
        </Item>
    );
};

// CourseItem.propTypes = {
//     url: PropTypes.string.isRequired,
//     title: PropTypes.string.isRequired,
//     subtitle: PropTypes.string.isRequired,
//     color: PropTypes.string.isRequired,
// };

export default CourseItem;
