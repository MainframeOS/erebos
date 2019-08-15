import { Subscriber, Subscription } from 'rxjs';
import { AnonymousSubject } from 'rxjs/internal/Subject';
export declare class ElectronTransport<T = any> extends AnonymousSubject<T> {
    private _output;
    constructor(channel?: string);
    _subscribe(subscriber: Subscriber<T>): Subscription;
}
export declare function createTransport<T = any>(channel?: string): ElectronTransport<T>;
