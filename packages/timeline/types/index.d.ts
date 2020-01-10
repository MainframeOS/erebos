/// <reference types="node" />
import { Response, FetchOptions, PollOptions, UploadOptions } from '@erebos/bzz';
import { BzzFeed, FeedParams } from '@erebos/bzz-feed';
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
export declare type DecodeChapter<T, R extends Response> = (res: R) => Promise<Chapter<T>>;
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
export interface TimelineReaderConfig<T = any, S = any, B extends BzzFeed<S, Response<S>> = BzzFeed<S, Response<S>>> {
    bzz: B;
    feed: string | FeedParams;
    decode?: DecodeChapter<T, Response<S>>;
}
export interface TimelineWriterConfig<T = any, S = any, B extends BzzFeed<S, Response<S>> = BzzFeed<S, Response<S>>> extends TimelineReaderConfig<T, S, B> {
    encode?: EncodeChapter<T>;
    signParams?: any;
}
export declare class TimelineReader<T = any, S = any, B extends BzzFeed<S, Response<S>> = BzzFeed<S, Response<S>>> {
    protected readonly bzzFeed: B;
    protected readonly decode: DecodeChapter<T, Response<S>>;
    protected readonly feed: string | FeedParams;
    constructor(config: TimelineReaderConfig<T, S, B>);
    getChapter(id: string, options?: FetchOptions): Promise<Chapter<T>>;
    getLatestChapterID(options?: FetchOptions): Promise<string | null>;
    getLatestChapter(options?: FetchOptions): Promise<Chapter<T> | null>;
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
export declare class TimelineWriter<T = any, S = any, B extends BzzFeed<S, Response<S>> = BzzFeed<S, Response<S>>> extends TimelineReader<T, S, B> {
    protected encode: EncodeChapter<T>;
    protected signParams: any;
    constructor(config: TimelineWriterConfig<T, S, B>);
    postChapter(chapter: PartialChapter<T>, options?: UploadOptions): Promise<string>;
    setLatestChapterID(chapterID: string, options?: FetchOptions): Promise<void>;
    setLatestChapter(chapter: PartialChapter<T>, options?: UploadOptions): Promise<string>;
    addChapter(chapter: PartialChapter<T>, options?: UploadOptions): Promise<Chapter<T>>;
    createAddChapter(chapterDefaults?: Partial<PartialChapter<T>>, options?: UploadOptions): (partialChapter: Partial<PartialChapter<T>>) => Promise<Chapter<T>>;
}
export declare function createTimeline<T>(config: TimelineWriterConfig<T>): TimelineWriter<T>;
