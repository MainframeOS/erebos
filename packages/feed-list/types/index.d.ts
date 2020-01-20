import { FetchOptions, Response } from '@erebos/bzz';
import { BzzFeed, FeedID, FeedParams } from '@erebos/bzz-feed';
import { Hex } from '@erebos/hex';
export declare const MAX_CHUNK_BYTE_LENGTH: number;
export declare const MAX_CHUNK_VALUE_LENGTH: number;
export interface ForwardsChunkIterator<T> extends AsyncIterableIterator<T> {
    length: number;
}
declare type Res = Response<any>;
declare type Bzz = BzzFeed<any, Res>;
export interface ListReaderConfig<T = any, B extends Bzz = Bzz> {
    bzz: B;
    feed: FeedID | FeedParams;
    fetchOptions?: FetchOptions;
}
export interface ListWriterConfig<T = any, B extends Bzz = Bzz> extends ListReaderConfig<T, B> {
    signParams?: any;
}
export declare class ChunkListReader<T = Hex, B extends Bzz = Bzz> {
    protected readonly bzzFeed: B;
    protected readonly fetchOptions: FetchOptions;
    protected id: FeedID;
    constructor(config: ListReaderConfig<T, B>);
    getID(): FeedID;
    read(data: ArrayBuffer): Promise<T>;
    load(index: number): Promise<T | null>;
    createBackwardsIterator(maxIndex: number, minIndex?: number): AsyncIterableIterator<T | null>;
    createForwardsIterator(minIndex?: number, maxIndex?: number): ForwardsChunkIterator<T>;
}
export declare class ChunkListWriter<T = Hex, B extends Bzz = Bzz> extends ChunkListReader<T, B> {
    protected readonly signParams?: any;
    constructor(config: ListWriterConfig<T, B>);
    get length(): number;
    write(data: T): Promise<Hex>;
    push(data: T): Promise<void>;
}
export declare class DataListReader<T = any, B extends Bzz = Bzz> extends ChunkListReader<T, B> {
    read(chunk: ArrayBuffer): Promise<T>;
}
export declare class DataListWriter<T = any, B extends Bzz = Bzz> extends ChunkListWriter<T, B> implements DataListReader<T, B> {
    read(chunk: ArrayBuffer): Promise<T>;
    write(data: T): Promise<Hex>;
}
export {};
