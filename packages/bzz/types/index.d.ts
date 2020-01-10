/// <reference types="node" />
import { RequestInit, Response, Fetch, BzzConfig, BzzMode, DownloadOptions, FetchOptions, ListResult, PinOptions, PinnedFile, Tag, UploadOptions } from './types';
export * from './http';
export * from './types';
export * from './utils';
export declare const BZZ_MODE_PROTOCOLS: {
    default: string;
    feed: string;
    feedRaw: string;
    immutable: string;
    pin: string;
    raw: string;
    tag: string;
};
export declare function getModeProtocol(mode?: BzzMode): string;
export declare class Bzz<S, R extends Response<S>, F = any> {
    protected readonly defaultTimeout: number;
    protected readonly fetch: Fetch<R>;
    readonly url: string;
    constructor(config: BzzConfig<R>);
    fetchTimeout(url: string, options: FetchOptions, params?: RequestInit): Promise<R>;
    getDownloadURL(hash: string, options?: DownloadOptions, raw?: boolean): string;
    getUploadURL(options?: UploadOptions, raw?: boolean): string;
    getPinURL(hash?: string, raw?: boolean): string;
    hash(domain: string, options?: FetchOptions): Promise<string>;
    list(hash: string, options?: DownloadOptions): Promise<ListResult>;
    download(hash: string, options?: DownloadOptions): Promise<R>;
    downloadStream(hash: string, options?: DownloadOptions): Promise<S>;
    downloadData<T = any>(hash: string, options?: DownloadOptions): Promise<T>;
    downloadTar(hash: string, options: DownloadOptions): Promise<R>;
    protected uploadBody(body: Buffer | F | S, options: UploadOptions, raw?: boolean): Promise<string>;
    uploadFile(data: string | Buffer | S, options?: UploadOptions): Promise<string>;
    uploadData<T = any>(data: T, options?: UploadOptions): Promise<string>;
    deleteResource(hash: string, path: string, options?: FetchOptions): Promise<string>;
    pinEnabled(options?: FetchOptions): Promise<boolean>;
    pin(hash: string, options?: PinOptions): Promise<void>;
    unpin(hash: string, options?: FetchOptions): Promise<void>;
    pins(options?: FetchOptions): Promise<Array<PinnedFile>>;
    getTag(hash: string, options?: FetchOptions): Promise<Tag>;
}
