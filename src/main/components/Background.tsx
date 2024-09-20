import { useEffect, useRef, useState } from "react";

// import { crawlCourse } from "../../scraper/course.ts";
// import { crawlAssignment } from "../../scraper/assignment.ts";
// import { crawlQuiz } from "../../scraper/quiz.ts";
// import { Activity, ActivityType, Section } from "../../librarys/type";
// import { crawlVideo } from "../../scraper/vod.ts";

import styled from "styled-components";
import { decode } from "blurhash";

const Container = styled.div`
    width: 100%;
    height: 100%;
`;

const Preview = styled.canvas`
    position: absolute;
    width: 100%;
    height: 100%;
    transition: opacity 0.5s;
    opacity: 0;
    filter: contrast(0.7) brightness(1);

    &.complete {
        opacity: 1;
    }
`;

const Image = styled.img`
    position: absolute;
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: opacity 0.5s;
    opacity: 0;
    filter: contrast(0.7) brightness(1);

    &.complete {
        opacity: 1;
    }
`;

const Vignette = styled.div`
    position: absolute;
    width: 100%;
    height: 100%;
    /* background: radial-gradient(
        circle at calc(400px + 50%) 50%,
        rgba(0, 0, 0, 0) 20%,
        rgba(0, 0, 0, 0.6) 80%
    ); */

    background: linear-gradient(
        270deg,
        rgba(0, 0, 0, 0) 0%,
        rgba(0, 0, 0, 0.5) 66%
    );
`;

async function getImage() {
    const res = await fetch(
        "https://api.kiriko.dev/smartlead-plus/v1/wallpaper/general/10m"
    );

    const data = (await res.json())[0];

    return {
        blurhash: data.blur_hash as string,
        location: data.location.name as string,
        user: data.user.name as string,
        src: data.urls.full as string,
    };
}

const Background = () => {
    const canvas = useRef<HTMLCanvasElement>(null);
    const [location, setLocation] = useState("");
    const [blurhash, setBlurhash] = useState("");
    const [user, setUser] = useState("");
    const [src, setSrc] = useState("");
    const [isLoaded, setLoaded] = useState(false);

    useEffect(() => {
        getImage().then((result) => {
            setLocation(result.location);
            setBlurhash(result.blurhash);
            setUser(result.user);
            setSrc(
                `${result.src.replace("&fm=jpg", "&fm=webp")}&dpr=1.5&w=${window.screen.width}`
            );
        });
    }, []);

    useEffect(() => {
        if (!src || !canvas || !canvas.current) {
            return;
        }

        const width = (canvas.current.width = 16);
        const height = (canvas.current.height = 10);
        const ctx = canvas.current.getContext("2d");

        if (!ctx) {
            return;
        }

        const imageArray = ctx.createImageData(width, height);
        const blurhashArray = decode(blurhash, width, height);
        imageArray.data.set(blurhashArray);
        ctx.putImageData(imageArray, 0, 0);

        canvas.current.classList.add("complete");
    }, [canvas, blurhash, src]);

    return (
        <Container>
            <Preview ref={canvas} />
            <Image
                src={src}
                onLoad={() => setLoaded(true)}
                className={isLoaded ? "complete" : ""}
            />
            <Vignette />
        </Container>
    );
};

export default Background;
