import { Fetch, PinnedFile, PinResponse, Response, Tag, TagResponse } from './types';
export declare function formatPinnedFile(p: PinResponse): PinnedFile;
export declare function formatTag(t: TagResponse): Tag;
export declare function getGlobal(): typeof globalThis;
export declare function getGlobalFetch<R extends Response>(): Fetch<R>;
export declare function toSwarmHash(buffer: ArrayBuffer): string;
