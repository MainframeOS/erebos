import { PinnedFile, PinResponse, Tag, TagResponse } from './types';
export declare function formatPinnedFile(p: PinResponse): PinnedFile;
export declare function formatTag(t: TagResponse): Tag;
export declare function getGlobal(): typeof globalThis;
export declare function toSwarmHash(buffer: ArrayBuffer): string;
