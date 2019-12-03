import { hexInput, hexValue } from '@erebos/hex';
import { FeedMetadata, FeedTopicParams, FeedParams } from './types';
export declare const FEED_ZERO_TOPIC: hexValue;
export declare function createFeedDigest(meta: FeedMetadata, data: hexInput): Array<number>;
export declare function getFeedTopic(params: FeedTopicParams): hexValue;
export declare function feedParamsToReference(params: FeedParams): hexValue;
export declare function feedChunkToData(chunkData: ArrayBuffer): ArrayBuffer;
export declare function feedParamsToMetadata(params: FeedParams): FeedMetadata;
