/// <reference types="node" />
import { Bzz, DownloadOptions, Response, UploadOptions } from '@erebos/bzz';
import { hexInput, hexValue } from '@erebos/hex';
import { Observable } from 'rxjs';
import { FeedID } from './feed';
import { BzzFeedConfig, FeedMetadata, FeedParams, FeedUpdateParams, FetchOptions, PollFeedOptions, PollFeedContentHashOptions, PollFeedContentOptions, SignBytesFunc } from './types';
export * from './feed';
export * from './types';
export declare class BzzFeed<S, R extends Response<S>> {
    protected readonly signBytes: SignBytesFunc;
    readonly bzz: Bzz<S, R>;
    constructor(config: BzzFeedConfig<S, R>);
    sign(bytes: Array<number>, params?: any): Promise<hexValue>;
    getFeedURL(hashOrParams: string | FeedParams | FeedUpdateParams, flag?: 'meta'): string;
    createFeedManifest(params: FeedParams, options?: UploadOptions): Promise<string>;
    getFeedMetadata(hashOrParams: string | FeedParams, options?: FetchOptions): Promise<FeedMetadata>;
    getFeedChunk(hashOrParams: string | FeedParams, options?: FetchOptions): Promise<R>;
    getFeedContentHash(hashOrParams: string | FeedParams, options?: FetchOptions): Promise<string>;
    getFeedContent(hashOrParams: string | FeedParams, options?: DownloadOptions): Promise<R>;
    pollFeedChunk(hashOrParams: string | FeedParams, options: PollFeedOptions): Observable<R>;
    pollFeedContentHash(hashOrParams: string | FeedParams, options: PollFeedContentHashOptions): Observable<string | null>;
    pollFeedContent(hashOrParams: string | FeedParams, options: PollFeedContentOptions): Observable<R | null>;
    postSignedFeedChunk(params: FeedUpdateParams, body: Buffer, options?: FetchOptions): Promise<R>;
    postFeedChunk(meta: FeedMetadata, data: hexInput, options?: FetchOptions, signParams?: any): Promise<R>;
    setFeedChunk(hashOrParams: string | FeedParams, data: hexInput, options?: FetchOptions, signParams?: any): Promise<R>;
    setFeedContentHash(hashOrParams: string | FeedParams, contentHash: string, options?: FetchOptions, signParams?: any): Promise<R>;
    setFeedContent(hashOrParams: string | FeedParams, content: string | Buffer | S, options?: UploadOptions, signParams?: any): Promise<string>;
    getRawFeedChunk(feed: FeedID | FeedMetadata | FeedParams, options?: FetchOptions): Promise<R>;
    getRawFeedChunkData(feed: FeedID | FeedMetadata | FeedParams, options?: FetchOptions): Promise<ArrayBuffer>;
    getRawFeedContentHash(feed: FeedID | FeedMetadata | FeedParams, options?: FetchOptions): Promise<string>;
    getRawFeedContent(feed: FeedID | FeedMetadata | FeedParams, options?: DownloadOptions): Promise<R>;
    setRawFeedContentHash(feed: FeedID | FeedMetadata | FeedParams, contentHash: string, options?: UploadOptions, signParams?: any): Promise<R>;
    setRawFeedContent(feed: FeedID | FeedMetadata | FeedParams, content: string | Buffer | S, options?: UploadOptions, signParams?: any): Promise<string>;
}
