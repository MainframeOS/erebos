import { Feed } from '@erebos/bzz-feed';
import { DataListReader } from '@erebos/feed-list';
import { Doc } from 'automerge';
import { BehaviorSubject } from 'rxjs';
import { Bzz, DataPayload, DocReaderParams, DocSerialized, FromJSONDocReaderParams, LoadDocReaderParams } from './types';
export declare class DocReader<T, B extends Bzz = Bzz> extends BehaviorSubject<Doc<T>> {
    static fromJSON<T, B extends Bzz = Bzz>(params: FromJSONDocReaderParams<B>): DocReader<T, B>;
    static load<T, B extends Bzz = Bzz>(params: LoadDocReaderParams<B>): Promise<DocReader<T, B>>;
    protected bzz: B;
    protected feed: Feed;
    protected list: DataListReader<DataPayload, B>;
    protected time: number;
    private pullPromise;
    constructor(params: DocReaderParams<T, B>);
    get metaFeed(): Feed;
    protected write(doc: Doc<T>): boolean;
    protected load(): Promise<boolean>;
    pull(): Promise<boolean>;
    toJSON(): DocSerialized;
}
