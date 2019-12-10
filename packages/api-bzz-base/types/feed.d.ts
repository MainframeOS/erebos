/// <reference types="node" />
import { hexInput, hexValue } from '@erebos/hex';
import { Feed, FeedEpoch, FeedMetadata, FeedTopicParams, FeedParams } from './types';
export declare const FEED_MAX_DATA_LENGTH: number;
export declare const FEED_ZERO_TOPIC: hexValue;
export declare function isFeedMetadata(input: any): input is FeedMetadata;
export declare function getFeedChunkData(chunk: ArrayBuffer): ArrayBuffer;
export declare function getFeedTopic(params: FeedTopicParams): hexValue;
export declare function feedMetaToBuffer(meta: FeedMetadata): Buffer;
export declare function feedMetaToHash(meta: FeedMetadata): string;
export declare function createFeedDigest(meta: FeedMetadata, data: hexInput): Array<number>;
export declare class FeedID implements FeedParams, FeedMetadata {
    static from(input: Buffer | FeedID | FeedMetadata | FeedParams): FeedID;
    static fromBuffer(buffer: Buffer): FeedID;
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
    toBuffer(): Buffer;
    toHash(): string;
}
export declare function getFeedMetadata(input: FeedID | FeedMetadata | FeedParams): FeedMetadata;
