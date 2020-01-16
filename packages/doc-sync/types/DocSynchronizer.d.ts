import { Subscription } from 'rxjs';
import { DocSubscriber } from './DocSubscriber';
import { DocWriter } from './DocWriter';
import { Bzz, DocSynchronizerParams, DocSynchronizerSerialized, FromJSONDocSynchronizerParams, InitDocSynchronizerParams, LoadDocSynchronizerParams } from './types';
export declare class DocSynchronizer<T, B extends Bzz = Bzz> extends DocWriter<T, B> {
    static init<T, B extends Bzz = Bzz>(params: InitDocSynchronizerParams<T, B>): Promise<DocSynchronizer<T, B>>;
    static fromJSON<T, B extends Bzz = Bzz>(params: FromJSONDocSynchronizerParams<B>): DocSynchronizer<T, B>;
    static load<T, B extends Bzz = Bzz>(params: LoadDocSynchronizerParams<B>): Promise<DocSynchronizer<T, B>>;
    protected pushInterval: number | null;
    protected sources: Array<DocSubscriber<T, B>>;
    protected subscription: Subscription | null;
    constructor(params: DocSynchronizerParams<T, B>);
    start(): void;
    stop(): void;
    pullSources(): Promise<boolean>;
    toJSON(): DocSynchronizerSerialized;
}
