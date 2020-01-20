import { DataListWriter } from '@erebos/feed-list';
import { ChangeFn, Doc } from 'automerge';
import { DocReader } from './DocReader';
import { Bzz, CreateDocWriterParams, DataPayload, DocFeeds, DocSerialized, DocWriterParams, FeedFactoryParams, FromJSONDocWriterParams, InitDocWriterParams, LoadDocWriterParams, MetaSnapshot } from './types';
export declare const DATA_FEED_NAME: string;
export declare const META_FEED_NAME: string;
export declare function getDocFeeds(feed: FeedFactoryParams): DocFeeds;
export declare class DocWriter<T, B extends Bzz = Bzz> extends DocReader<T, B> {
    static create<T, B extends Bzz = Bzz>(params: CreateDocWriterParams<B>): DocWriter<T, B>;
    static init<T, B extends Bzz = Bzz>(params: InitDocWriterParams<T, B>): Promise<DocWriter<T, B>>;
    static fromJSON<T, B extends Bzz = Bzz>(params: FromJSONDocWriterParams<B>): DocWriter<T, B>;
    static load<T, B extends Bzz = Bzz>(params: LoadDocWriterParams<B>): Promise<DocWriter<T, B>>;
    protected list: DataListWriter<DataPayload, B>;
    protected pushedDoc: Doc<T> | null;
    protected pushQueue: Promise<string> | null;
    protected signParams: any | undefined;
    protected snapshot: MetaSnapshot | undefined;
    protected snapshotFrequency: number | null;
    constructor(params: DocWriterParams<T, B>);
    get length(): number;
    change(updater: ChangeFn<T>): boolean;
    merge(other: Doc<T>): boolean;
    private pushChanges;
    push(): Promise<string | null>;
    toJSON(): DocSerialized;
}
