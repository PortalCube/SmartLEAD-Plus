//@ts-ignore
import muxjs from "mux.js";
//@ts-ignore
import { Parser as m3u8Parser } from "m3u8-parser";

import streamSaver from "streamsaver";

export function getBaseUrl(uuid: string) {
    return `https://didtculpuhjx4953564.cdn.ntruss.com/hls/${uuid}/mp4/${uuid}.mp4/`;
}

export async function getVideoMetadata(baseUrl: string) {
    const response = await fetch(baseUrl + "index.m3u8");
    const metadata = await response.text();

    const parser = new m3u8Parser();

    parser.push(metadata);
    parser.end();

    return parser.manifest;
}

export function mergeVideo(
    title: string,
    uuid: string,
    onProgress: (count: number, total: number, size: number) => void
) {
    return new Promise<void>(async (resolve) => {
        const baseUrl = getBaseUrl(uuid);
        const manifest = await getVideoMetadata(baseUrl);

        onProgress(0, manifest.segments.length, 0);

        const fileStream: WritableStream = streamSaver.createWriteStream(
            `${title}.mp4`
        );
        const writer = fileStream.getWriter();

        const duration = manifest.segments.reduce(
            (result: number, item: any) => result + item.duration,
            0
        );

        // 매니페스트에서 세그먼트를 추출
        const segments = manifest.segments.map(
            (item: { duration: number; uri: string; timeline: number }) =>
                baseUrl + item.uri
        );

        // Transmuxer 생성
        let transmuxer = new muxjs.mp4.Transmuxer({ duration });

        if (segments.length == 0) {
            return;
        }

        let byteLength = 0;

        const appendNextSegment = async () => {
            transmuxer.on("data", async (segment: any) => {
                const buffer = new Uint8Array(segment.data);

                writer.write(buffer);
                transmuxer.off("data");

                byteLength += buffer.byteLength;

                onProgress(
                    manifest.segments.length - segments.length,
                    manifest.segments.length,
                    byteLength
                );
            });

            if (segments.length == 0) {
                writer.close();
                resolve();
            }

            // fetch the next segment from the segments array and pass it into the transmuxer.push method
            const response = await fetch(segments.shift());
            const buffer = await response.arrayBuffer();
            const uint8Array = new Uint8Array(buffer);
            transmuxer.push(uint8Array);
            transmuxer.flush();
            appendNextSegment();
        };

        transmuxer.on("data", async (segment: any) => {
            let buffer = new Uint8Array(
                segment.initSegment.byteLength + segment.data.byteLength
            );

            // Uint8Array에 initSegment와 data를 복사
            buffer.set(segment.initSegment, 0);
            buffer.set(segment.data, segment.initSegment.byteLength);

            writer.write(buffer);

            // 초기 data 이벤트 리스너를 리셋
            transmuxer.off("data");

            byteLength += buffer.byteLength;

            onProgress(
                manifest.segments.length - segments.length,
                manifest.segments.length,
                byteLength
            );

            appendNextSegment();
        });

        // 비디오 세그먼트를 다운받고 transmuxer에 push
        const response = await fetch(segments.shift());
        const buffer = await response.arrayBuffer();
        const uint8Array = new Uint8Array(buffer);
        transmuxer.push(uint8Array);
        transmuxer.flush();
    });
}
