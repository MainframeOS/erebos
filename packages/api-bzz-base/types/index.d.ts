/// <reference types="node" />
import { hexInput, hexValue } from '@erebos/hex';
import { Observable } from 'rxjs';
import { BaseResponse, RequestInit, Fetch, BzzConfig, BzzMode, DirectoryData, DownloadOptions, FeedMetadata, FeedParams, FeedUpdateParams, FetchOptions, ListResult, PollOptions, PollContentHashOptions, PollContentOptions, SignBytesFunc, UploadOptions } from './types';
export * from './feed';
export * from './types';
export declare const BZZ_MODE_PROTOCOLS: {
    default: string;
    feed: string;
    immutable: string;
    raw: string;
};
export declare function getModeProtocol(mode?: BzzMode): string;
export declare class HTTPError extends Error {
    status: number;
    constructor(status: number, message: string);
}
export declare function resOrError<R extends BaseResponse>(res: R): R;
export declare function resJSON<R extends BaseResponse, T = any>(res: R): Promise<T>;
export declare function resText<R extends BaseResponse>(res: R): Promise<string>;
export declare function resHex<R extends BaseResponse>(res: R): Promise<hexValue>;
export declare function resSwarmHash<R extends BaseResponse>(res: R): Promise<string>;
export declare class BzzBase<Response extends BaseResponse> {
    protected defaultTimeout: number;
    protected fetch: Fetch<Response>;
    protected signBytes: SignBytesFunc;
    protected url: string;
    constructor(fetch: Fetch<Response>, config: BzzConfig);
    protected fetchTimeout(url: string, options: FetchOptions, params?: RequestInit): Promise<Response>;
    sign(bytes: Array<number>, params?: any): Promise<hexValue>;
    getDownloadURL(hash: string, options?: DownloadOptions, raw?: boolean): string;
    getUploadURL(options?: UploadOptions, raw?: boolean): string;
    getFeedURL(hashOrParams: string | FeedParams | FeedUpdateParams, flag?: 'meta'): string;
    hash(domain: string, options?: FetchOptions): Promise<hexValue>;
    list(hash: string, options?: DownloadOptions): Promise<ListResult>;
    protected _download(hash: string, options: DownloadOptions): Promise<Response>;
    download(hash: string, options?: DownloadOptions): Promise<Response>;
    protected _upload(body: any, options: UploadOptions, raw?: boolean): Promise<hexValue>;
    uploadFile(data: string | Buffer, options?: UploadOptions): Promise<hexValue>;
    uploadDirectory(_directory: DirectoryData, _options?: UploadOptions): Promise<hexValue>;
    upload(data: string | Buffer | DirectoryData, options?: UploadOptions): Promise<hexValue>;
    deleteResource(hash: string, path: string, options?: FetchOptions): Promise<hexValue>;
    createFeedManifest(params: FeedParams, options?: UploadOptions): Promise<hexValue>;
    getFeedMetadata(hashOrParams: string | FeedParams, options?: FetchOptions): Promise<FeedMetadata>;
    getFeedChunk(hashOrParams: string | FeedParams, options?: FetchOptions): Promise<Response>;
    getFeedContentHash(hashOrParams: string | FeedParams, options?: FetchOptions): Promise<string>;
    getFeedContent(hashOrParams: string | FeedParams, options?: DownloadOptions): Promise<Response>;
    pollFeedChunk(hashOrParams: string | FeedParams, options: PollOptions): Observable<Response>;
    pollFeedContentHash(hashOrParams: string | FeedParams, options: PollContentHashOptions): Observable<string | null>;
    pollFeedContent(hashOrParams: string | FeedParams, options: PollContentOptions): Observable<Response | null>;
    postSignedFeedChunk(params: FeedUpdateParams, body: Buffer, options?: FetchOptions): Promise<Response>;
    postFeedChunk(meta: FeedMetadata, data: hexInput, options?: FetchOptions, signParams?: any): Promise<Response>;
    setFeedChunk(hashOrParams: string | FeedParams, data: hexInput, options?: FetchOptions, signParams?: any): Promise<Response>;
    setFeedContentHash(hashOrParams: string | FeedParams, contentHash: string, options?: FetchOptions, signParams?: any): Promise<Response>;
    setFeedContent(hashOrParams: string | FeedParams, data: string | Buffer | DirectoryData, options?: UploadOptions, signParams?: any): Promise<hexValue>;
}
