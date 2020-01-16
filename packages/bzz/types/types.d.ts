/// <reference types="node" />
export interface Response<BodyStream = any> {
    readonly ok: boolean;
    readonly status: number;
    readonly statusText: string;
    readonly body: BodyStream;
    text(): Promise<string>;
    json<T = any>(): Promise<T>;
    arrayBuffer(): Promise<ArrayBuffer>;
}
export declare type RequestInit = Record<string, any>;
export declare type Fetch<R extends Response> = (resource: string, init?: RequestInit) => Promise<R>;
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
    manifestHash?: string;
    pin?: boolean;
    size?: number;
}
export interface PollOptions extends FetchOptions {
    interval: number;
    immediate?: boolean;
}
export interface PinOptions extends FetchOptions {
    download?: boolean;
    raw?: boolean;
}
export interface PinResponse {
    Address: string;
    FileSize: number;
    IsRaw: boolean;
    PinCounter: number;
}
export interface PinnedFile {
    address: string;
    counter: number;
    raw: boolean;
    size: number;
}
export interface TagResponse {
    Uid: number;
    Name: string;
    Address: string;
    Total: number;
    Split: number;
    Seen: number;
    Stored: number;
    Sent: number;
    Synced: number;
    StartedAt: string;
}
export interface Tag {
    uid: number;
    name: string;
    address: string;
    total: number;
    split: number;
    seen: number;
    stored: number;
    sent: number;
    synced: number;
    startedAt: Date;
}
export interface BzzConfig<R extends Response> {
    fetch?: Fetch<R>;
    timeout?: number;
    url: string;
}
