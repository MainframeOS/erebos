import { FeedParams } from '@erebos/api-bzz-base';
import { DataListReader } from '@erebos/feed-list';
import { Doc } from 'automerge';
import { BehaviorSubject } from 'rxjs';
import { BzzInstance, DataContent, DocReaderParams, DocSerialized, FromJSONDocParams, LoadDocParams } from './types';
export declare class DocReader<T, Bzz extends BzzInstance = BzzInstance> extends BehaviorSubject<Doc<T>> {
    static fromJSON<T, Bzz extends BzzInstance = BzzInstance>(params: FromJSONDocParams<Bzz>): DocReader<T, Bzz>;
    static load<T, Bzz extends BzzInstance = BzzInstance>(params: LoadDocParams<Bzz>): Promise<DocReader<T, Bzz>>;
    protected bzz: Bzz;
    protected feed: FeedParams;
    protected list: DataListReader<DataContent, Bzz>;
    protected time: number;
    private pullPromise;
    constructor(params: DocReaderParams<T, Bzz>);
    get metaFeed(): FeedParams;
    protected write(doc: Doc<T>): boolean;
    protected load(): Promise<boolean>;
    pull(): Promise<boolean>;
    toJSON(): DocSerialized;
}
