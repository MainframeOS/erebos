import { DataListWriter } from '@erebos/feed-list';
import { ChangeFn, Doc } from 'automerge';
import { DocReader } from './DocReader';
import { Bzz, CreateDocWriterParams, DataContent, DocFeeds, DocSerialized, DocWriterParams, FeedFactoryParams, FromJSONDocParams, InitDocWriterParams, LoadDocParams } from './types';
export declare const DATA_FEED_NAME = "doc-sync/data";
export declare const META_FEED_NAME = "doc-sync/meta";
export declare function getDocFeeds(feed: FeedFactoryParams): DocFeeds;
export declare class DocWriter<T, B extends Bzz = Bzz> extends DocReader<T, B> {
    static create<T, B extends Bzz = Bzz>(params: CreateDocWriterParams<B>): DocWriter<T, B>;
    static init<T, B extends Bzz = Bzz>(params: InitDocWriterParams<T, B>): Promise<DocWriter<T, B>>;
    static fromJSON<T, B extends Bzz = Bzz>(params: FromJSONDocParams<B>): DocWriter<T, B>;
    static load<T, B extends Bzz = Bzz>(params: LoadDocParams<B>): Promise<DocWriter<T, B>>;
    protected list: DataListWriter<DataContent, B>;
    protected pushedDoc: Doc<T> | null;
    protected pushQueue: Promise<string> | null;
    constructor(params: DocWriterParams<T, B>);
    get length(): number;
    change(updater: ChangeFn<T>): boolean;
    merge(other: Doc<T>): boolean;
    private pushChanges;
    push(): Promise<string | null>;
    toJSON(): DocSerialized;
}
