import { Observable, Subject } from 'rxjs';
import { BaseRPC } from '@erebos/rpc-base';
export declare class StreamRPC extends BaseRPC {
    private _observers;
    private _subscribers;
    private _subscription;
    private _transport;
    constructor(transport: Subject<any>);
    readonly connected: boolean;
    connect(): void;
    disconnect(): void;
    observe<P = any, R = any>(method: string, params?: P): Observable<R>;
    request<P = any, R = any>(method: string, params?: P): Promise<R>;
    notify(method: string, params?: any): void;
    subscribe(...args: Array<any>): () => void;
}
