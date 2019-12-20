import { ChangeFn, Doc } from 'automerge';
import { Subject, Subscription } from 'rxjs';
import { DocSubscriber } from './DocSubscriber';
import { DocWriter } from './DocWriter';
import { BzzInstance, DocSynchronizerParams, DocSynchronizerSerialized, FromJSONDocSynchronizerParams, InitDocSynchronizerParams, LoadDocSynchronizerParams } from './types';
export declare class DocSynchronizer<T, Bzz extends BzzInstance> extends Subject<Doc<T>> {
    static init<T, Bzz extends BzzInstance = BzzInstance>(params: InitDocSynchronizerParams<T, Bzz>): Promise<DocSynchronizer<T, Bzz>>;
    static fromJSON<T, Bzz extends BzzInstance = BzzInstance>(params: FromJSONDocSynchronizerParams<Bzz>): DocSynchronizer<T, Bzz>;
    static load<T, Bzz extends BzzInstance = BzzInstance>(params: LoadDocSynchronizerParams<Bzz>): Promise<DocSynchronizer<T, Bzz>>;
    protected writer: DocWriter<T, Bzz>;
    protected pushInterval: number | null;
    protected sources: Array<DocSubscriber<T, Bzz>>;
    protected subscription: Subscription | null;
    constructor(params: DocSynchronizerParams<T, Bzz>);
    get value(): Doc<T>;
    start(): void;
    stop(): void;
    change(updater: ChangeFn<T>): boolean;
    push(): Promise<string | null>;
    pull(): Promise<boolean>;
    pullSources(): Promise<boolean>;
    toJSON(): DocSynchronizerSerialized;
}
