import { DocReader } from './DocReader';
import { BzzInstance, DocSubscriberParams, FromJSONDocSubscriberParams, LoadDocSubscriberParams } from './types';
export declare class DocSubscriber<T, Bzz extends BzzInstance = BzzInstance> extends DocReader<T, Bzz> {
    static fromJSON<T, Bzz extends BzzInstance = BzzInstance>(params: FromJSONDocSubscriberParams<Bzz>): DocSubscriber<T, Bzz>;
    static load<T, Bzz extends BzzInstance = BzzInstance>(params: LoadDocSubscriberParams<Bzz>): Promise<DocSubscriber<T, Bzz>>;
    private pullInterval;
    private subscription;
    constructor(params: DocSubscriberParams<T, Bzz>);
    start(): void;
    stop(): void;
}
