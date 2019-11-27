/// <reference types="node" />
import * as stream from 'stream';
import { BaseBzz, BaseResponse, FeedParams, FetchOptions, PollOptions, UploadOptions } from '@erebos/api-bzz-base';
import { hexValue } from '@erebos/hex';
import { Observable } from 'rxjs';
export declare const PROTOCOL = "timeline";
export declare const VERSION = "1.0.0";
export declare const VERSION_RANGE = "^1.0.0";
export interface PartialChapter<T = any> {
    protocol: string;
    version: string;
    timestamp: number;
    author: string;
    type: string;
    content: T;
    previous?: string | null;
    references?: Array<string>;
    signature?: string;
}
export interface Chapter<T = any> extends PartialChapter<T> {
    id: string;
}
export declare type DecodeChapter<T, R extends BaseResponse = BaseResponse> = (res: R) => Promise<Chapter<T>>;
export declare type EncodeChapter<T> = (chapter: PartialChapter<T>) => Promise<string | Buffer>;
export interface LiveOptions extends PollOptions {
    previous?: string;
    timestamp?: number;
}
export declare function createChapter<T>(chapter: Partial<PartialChapter<T>>): PartialChapter<T>;
export interface MaybeChapter extends Record<string, any> {
    protocol?: string;
    version?: string;
}
export declare function validateChapter<T extends MaybeChapter>(chapter: T): T;
export interface TimelineConfig<T = any, Bzz extends BaseBzz<BaseResponse, stream.Readable> = BaseBzz<BaseResponse, stream.Readable>> {
    bzz: Bzz;
    feed: string | FeedParams;
    decode?: DecodeChapter<T>;
    encode?: EncodeChapter<T>;
    signParams?: any;
}
export declare class Timeline<T = any, Bzz extends BaseBzz<BaseResponse, stream.Readable> = BaseBzz<BaseResponse, stream.Readable>> {
    protected bzz: Bzz;
    protected decode: DecodeChapter<T>;
    protected encode: EncodeChapter<T>;
    protected feed: string | FeedParams;
    protected signParams: any;
    constructor(config: TimelineConfig<T, Bzz>);
    getChapter(id: string, options?: FetchOptions): Promise<Chapter<T>>;
    postChapter(chapter: PartialChapter<T>, options?: UploadOptions): Promise<hexValue>;
    getLatestChapterID(options?: FetchOptions): Promise<string | null>;
    getLatestChapter(options?: FetchOptions): Promise<Chapter<T> | null>;
    setLatestChapterID(chapterID: string, options?: FetchOptions): Promise<void>;
    setLatestChapter(chapter: PartialChapter<T>, options?: UploadOptions): Promise<hexValue>;
    addChapter(chapter: PartialChapter<T>, options?: UploadOptions): Promise<Chapter<T>>;
    createAddChapter(chapterDefaults?: Partial<PartialChapter<T>>, options?: UploadOptions): (partialChapter: Partial<PartialChapter<T>>) => Promise<Chapter<T>>;
    createIterator(initialID?: string, options?: FetchOptions): AsyncIterator<Chapter<T>>;
    createLoader(newestID: string, // inclusive
    oldestID: string, // exclusive
    options?: FetchOptions): Observable<Chapter<T>>;
    getChapters(newestID: string, // inclusive
    oldestID: string, // exclusive
    options?: FetchOptions): Promise<Array<Chapter<T>>>;
    pollLatestChapter(options: PollOptions): Observable<Chapter<T>>;
    live(options: LiveOptions): Observable<Array<Chapter<T>>>;
}
export declare function createTimeline<T>(config: TimelineConfig<T>): Timeline<T>;
