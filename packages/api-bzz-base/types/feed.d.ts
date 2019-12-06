import { hexInput, hexValue } from '@erebos/hex';
import { Feed, FeedEpoch, FeedMetadata, FeedTopicParams, FeedParams } from './types';
export declare const FEED_MAX_DATA_LENGTH: number;
export declare const FEED_ZERO_TOPIC: hexValue;
export declare function isFeedMetadata(input: any): input is FeedMetadata;
export declare function getFeedChunkData(chunk: ArrayBuffer): ArrayBuffer;
export declare function getFeedTopic(params: FeedTopicParams): hexValue;
export declare function feedParamsToHash(params: FeedParams): string;
export declare class FeedID implements FeedParams, FeedMetadata {
    static fromMetadata(meta: FeedMetadata): FeedID;
    user: hexValue;
    topic: hexValue;
    time: number;
    level: number;
    protocolVersion: number;
    constructor(params: FeedParams);
    get feed(): Feed;
    get epoch(): FeedEpoch;
    clone(): FeedID;
    toHash(): string;
}
export declare function createFeedID(input: FeedID | FeedMetadata | FeedParams): FeedID;
export declare function getFeedMetadata(input: FeedID | FeedMetadata | FeedParams): FeedMetadata;
export declare function createFeedDigest(meta: FeedMetadata, data: hexInput): Array<number>;
