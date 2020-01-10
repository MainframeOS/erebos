import { DocReader } from './DocReader';
import { Bzz, DocSubscriberParams, FromJSONDocSubscriberParams, LoadDocSubscriberParams } from './types';
export declare class DocSubscriber<T, B extends Bzz = Bzz> extends DocReader<T, B> {
    static fromJSON<T, B extends Bzz = Bzz>(params: FromJSONDocSubscriberParams<B>): DocSubscriber<T, B>;
    static load<T, B extends Bzz = Bzz>(params: LoadDocSubscriberParams<B>): Promise<DocSubscriber<T, B>>;
    private pullInterval;
    private subscription;
    constructor(params: DocSubscriberParams<T, B>);
    start(): void;
    stop(): void;
}
