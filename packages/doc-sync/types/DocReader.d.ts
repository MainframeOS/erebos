import { FeedParams } from '@erebos/bzz-feed';
import { DataListReader } from '@erebos/feed-list';
import { Doc } from 'automerge';
import { BehaviorSubject } from 'rxjs';
import { Bzz, DataContent, DocReaderParams, DocSerialized, FromJSONDocParams, LoadDocParams } from './types';
export declare class DocReader<T, B extends Bzz = Bzz> extends BehaviorSubject<Doc<T>> {
    static fromJSON<T, B extends Bzz = Bzz>(params: FromJSONDocParams<B>): DocReader<T, B>;
    static load<T, B extends Bzz = Bzz>(params: LoadDocParams<B>): Promise<DocReader<T, B>>;
    protected bzz: B;
    protected feed: FeedParams;
    protected list: DataListReader<DataContent, B>;
    protected time: number;
    private pullPromise;
    constructor(params: DocReaderParams<T, B>);
    get metaFeed(): FeedParams;
    protected write(doc: Doc<T>): boolean;
    protected load(): Promise<boolean>;
    pull(): Promise<boolean>;
    toJSON(): DocSerialized;
}
