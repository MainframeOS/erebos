import { BaseRPC } from '@erebos/rpc-base';
export declare type FetchFunction = <D = any, R = any>(data: D) => Promise<R>;
export declare class RequestRPC extends BaseRPC {
    private fetch;
    constructor(fetch: FetchFunction);
    request<P = any, R = any, E = any>(method: string, params?: P): Promise<R>;
}
