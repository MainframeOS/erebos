/// <reference types="node" />
import { Bzz, DownloadOptions, FetchOptions, Response, UploadOptions } from '@erebos/bzz';
import { hexInput, hexValue } from '@erebos/hex';
import { Observable } from 'rxjs';
import { FeedID } from './feed';
import { BzzFeedConfig, FeedMetadata, FeedParams, FeedUpdateParams, PollFeedOptions, PollFeedContentHashOptions, PollFeedContentOptions, SignBytesFunc } from './types';
export * from './feed';
export * from './types';
export declare class BzzFeed<S, R extends Response<S>> {
    protected readonly signBytes: SignBytesFunc;
    readonly bzz: Bzz<S, R>;
    constructor(config: BzzFeedConfig<S, R>);
    sign(bytes: Array<number>, params?: any): Promise<hexValue>;
    getURL(hashOrParams: string | FeedParams | FeedUpdateParams, flag?: 'meta'): string;
    createManifest(params: FeedParams, options?: UploadOptions): Promise<string>;
    getMetadata(hashOrParams: string | FeedParams, options?: FetchOptions): Promise<FeedMetadata>;
    getChunk(hashOrParams: string | FeedParams, options?: FetchOptions): Promise<R>;
    getContentHash(hashOrParams: string | FeedParams, options?: FetchOptions): Promise<string>;
    getContent(hashOrParams: string | FeedParams, options?: DownloadOptions): Promise<R>;
    pollChunk(hashOrParams: string | FeedParams, options: PollFeedOptions): Observable<R>;
    pollContentHash(hashOrParams: string | FeedParams, options: PollFeedContentHashOptions): Observable<string | null>;
    pollContent(hashOrParams: string | FeedParams, options: PollFeedContentOptions): Observable<R | null>;
    postSignedChunk(params: FeedUpdateParams, body: Buffer, options?: FetchOptions): Promise<R>;
    postChunk(meta: FeedMetadata, data: hexInput, options?: FetchOptions, signParams?: any): Promise<R>;
    setChunk(hashOrParams: string | FeedParams, data: hexInput, options?: FetchOptions, signParams?: any): Promise<R>;
    setContentHash(hashOrParams: string | FeedParams, contentHash: string, options?: FetchOptions, signParams?: any): Promise<R>;
    setContent(hashOrParams: string | FeedParams, content: string | Buffer | S, options?: UploadOptions, signParams?: any): Promise<string>;
    getRawChunk(feed: FeedID | FeedMetadata | FeedParams, options?: FetchOptions): Promise<R>;
    getRawChunkData(feed: FeedID | FeedMetadata | FeedParams, options?: FetchOptions): Promise<ArrayBuffer>;
    getRawContentHash(feed: FeedID | FeedMetadata | FeedParams, options?: FetchOptions): Promise<string>;
    getRawContent(feed: FeedID | FeedMetadata | FeedParams, options?: DownloadOptions): Promise<R>;
    setRawContentHash(feed: FeedID | FeedMetadata | FeedParams, contentHash: string, options?: UploadOptions, signParams?: any): Promise<R>;
    setRawContent(feed: FeedID | FeedMetadata | FeedParams, content: string | Buffer | S, options?: UploadOptions, signParams?: any): Promise<string>;
}
