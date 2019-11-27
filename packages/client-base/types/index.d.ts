import { BaseRPC } from '@erebos/rpc-base';
import { StreamRPC } from '@erebos/rpc-stream';
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
export declare abstract class BaseClient {
    protected rpcInstance: StreamRPC | void;
    constructor(config?: ClientConfig);
    get rpc(): StreamRPC;
    disconnect(): void;
}
export {};
