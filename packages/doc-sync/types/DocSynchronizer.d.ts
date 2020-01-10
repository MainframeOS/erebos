import { ChangeFn, Doc } from 'automerge';
import { Subject, Subscription } from 'rxjs';
import { DocSubscriber } from './DocSubscriber';
import { DocWriter } from './DocWriter';
import { Bzz, DocSynchronizerParams, DocSynchronizerSerialized, FromJSONDocSynchronizerParams, InitDocSynchronizerParams, LoadDocSynchronizerParams } from './types';
export declare class DocSynchronizer<T, B extends Bzz = Bzz> extends Subject<Doc<T>> {
    static init<T, B extends Bzz = Bzz>(params: InitDocSynchronizerParams<T, B>): Promise<DocSynchronizer<T, B>>;
    static fromJSON<T, B extends Bzz = Bzz>(params: FromJSONDocSynchronizerParams<B>): DocSynchronizer<T, B>;
    static load<T, B extends Bzz = Bzz>(params: LoadDocSynchronizerParams<B>): Promise<DocSynchronizer<T, B>>;
    protected writer: DocWriter<T, B>;
    protected pushInterval: number | null;
    protected sources: Array<DocSubscriber<T, B>>;
    protected subscription: Subscription | null;
    constructor(params: DocSynchronizerParams<T, B>);
    get value(): Doc<T>;
    start(): void;
    stop(): void;
    change(updater: ChangeFn<T>): boolean;
    push(): Promise<string | null>;
    pull(): Promise<boolean>;
    pullSources(): Promise<boolean>;
    toJSON(): DocSynchronizerSerialized;
}
