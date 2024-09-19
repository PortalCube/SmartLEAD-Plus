export enum VodMessageType {
    VideoComplete = "VOD_COMPLETE",
    VideoDownloadRequest = "VOD_DOWNLOAD_REQUEST",
    VideoQueueAdd = "VOD_QUEUE_ADD",
    VideoQueueRemove = "VOD_QUEUE_REMOVE",
    VideoQueueSwap = "VOD_QUEUE_SWAP",
}

export interface VodMessage {
    type: VodMessageType;
    _slplusVodMessage: true;
}

export interface VodCompleteMessage extends VodMessage {
    type: VodMessageType.VideoComplete;
    data: {
        id: number;
        duration: number;
        position: number;
    };
}
