/// <reference types="node" />
import { hexValue } from '@erebos/hex';
import { Observable } from 'rxjs';
export interface BaseResponse<BodyStream = any> {
    readonly ok: boolean;
    readonly status: number;
    readonly statusText: string;
    readonly body: BodyStream;
    text(): Promise<string>;
    json<T = any>(): Promise<T>;
    arrayBuffer(): Promise<ArrayBuffer>;
}
export declare type RequestInit = Record<string, any>;
export declare type Fetch<Response extends BaseResponse> = (resource: string, init?: RequestInit) => Promise<Response>;
export interface DirectoryEntry {
    data: string | Buffer;
    contentType?: string;
    size?: number;
}
export declare type DirectoryData = Record<string, DirectoryEntry>;
export interface FileEntry {
    data: string | Buffer;
    path: string;
    size?: number;
}
export interface ListEntry {
    hash: string;
    path: string;
    contentType: string;
    size: number;
    mod_time: string;
}
export interface ListResult {
    common_prefixes?: Array<string>;
    entries?: Array<ListEntry>;
}
export interface FeedTopicParams {
    name?: string;
    topic?: string;
}
export interface FeedMetadata {
    feed: {
        topic: hexValue;
        user: hexValue;
    };
    epoch: {
        time: number;
        level: number;
    };
    protocolVersion: number;
}
export interface FetchOptions {
    headers?: Record<string, any>;
    timeout?: number;
}
export interface FileOptions extends FetchOptions {
    contentType?: string;
    path?: string;
}
export declare type BzzMode = 'default' | 'immutable' | 'raw';
export interface DownloadOptions extends FileOptions {
    mode?: BzzMode;
}
export interface UploadOptions extends FileOptions {
    defaultPath?: string;
    encrypt?: boolean;
    manifestHash?: hexValue | string;
}
export interface PollOptions extends FetchOptions {
    interval: number;
    immediate?: boolean;
    whenEmpty?: 'accept' | 'ignore' | 'error';
    trigger?: Observable<void>;
}
export interface PollContentHashOptions extends PollOptions {
    changedOnly?: boolean;
}
export interface PollContentOptions extends DownloadOptions, PollContentHashOptions {
}
export interface FeedParams {
    user: string;
    level?: number;
    name?: string;
    time?: number;
    topic?: string;
}
export interface FeedUpdateParams {
    user: string;
    level: number;
    time: number;
    topic: string;
    signature: string;
}
export declare type SignBytesFunc = (digest: Array<number>, params?: any) => Promise<Array<number>>;
export interface BzzConfig {
    signBytes?: SignBytesFunc;
    timeout?: number;
    url: string;
}
