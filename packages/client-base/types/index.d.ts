import { BzzBase, BaseResponse } from '@erebos/api-bzz-base';
import { Pss } from '@erebos/api-pss';
import BaseRPC from '@mainframe/rpc-base';
import StreamRPC from '@mainframe/rpc-stream';
export interface ClientConfig {
    http?: string;
    ipc?: string;
    rpc?: StreamRPC;
    ws?: string;
}
export declare type InstantiateAPI<T> = (maybeInstance: string | T | void, Cls: {
    new (): T;
}) => T | void;
declare type CreateRPC<T extends BaseRPC> = (endpoint: string) => T;
export declare function createInstantiateAPI<R extends BaseRPC>(createRPC: CreateRPC<R>): <T>(maybeInstance: string | void | T, Cls: new (rpc: R) => T) => void | T;
export declare abstract class ClientBase<Bzz extends BzzBase<BaseResponse>> {
    protected bzzInstance: Bzz | void;
    protected pssInstance: Pss | void;
    protected rpcInstance: StreamRPC | void;
    constructor(config?: ClientConfig);
    readonly bzz: Bzz;
    readonly pss: Pss;
    readonly rpc: StreamRPC;
    disconnect(): void;
}
export {};
