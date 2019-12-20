import { DataListWriter } from '@erebos/feed-list';
import { ChangeFn, Doc } from 'automerge';
import { DocReader } from './DocReader';
import { BzzInstance, CreateDocWriterParams, DataContent, DocFeeds, DocSerialized, DocWriterParams, FeedFactoryParams, FromJSONDocParams, InitDocWriterParams, LoadDocParams } from './types';
export declare const DATA_FEED_NAME = "doc-sync/data";
export declare const META_FEED_NAME = "doc-sync/meta";
export declare function getDocFeeds(feed: FeedFactoryParams): DocFeeds;
export declare class DocWriter<T, Bzz extends BzzInstance = BzzInstance> extends DocReader<T, Bzz> {
    static create<T, Bzz extends BzzInstance = BzzInstance>(params: CreateDocWriterParams<Bzz>): DocWriter<T, Bzz>;
    static init<T, Bzz extends BzzInstance = BzzInstance>(params: InitDocWriterParams<T, Bzz>): Promise<DocWriter<T, Bzz>>;
    static fromJSON<T, Bzz extends BzzInstance = BzzInstance>(params: FromJSONDocParams<Bzz>): DocReader<T, Bzz>;
    static load<T, Bzz extends BzzInstance = BzzInstance>(params: LoadDocParams<Bzz>): Promise<DocReader<T, Bzz>>;
    protected list: DataListWriter<DataContent, Bzz>;
    protected pushedDoc: Doc<T> | null;
    protected pushQueue: Promise<string> | null;
    constructor(params: DocWriterParams<T, Bzz>);
    get length(): number;
    change(updater: ChangeFn<T>): boolean;
    merge(other: Doc<T>): boolean;
    private pushChanges;
    push(): Promise<string | null>;
    toJSON(): DocSerialized;
}
