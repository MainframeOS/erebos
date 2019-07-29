import { hexInput, hexValue } from '@erebos/hex';
import { FeedMetadata, FeedTopicParams } from './types';
export declare function createFeedDigest(meta: FeedMetadata, data: hexInput): Array<number>;
export declare function getFeedTopic(params: FeedTopicParams): hexValue;
