export declare type RPCID = string | number | null;
export interface RPCRequest<T = any> {
    jsonrpc: '2.0';
    method: string;
    id?: RPCID;
    params?: T | undefined;
}
export interface RPCErrorObject<T = any> {
    code: number;
    message?: string | undefined;
    data?: T;
}
export interface RPCResponse<T = any, E = any> {
    jsonrpc: '2.0';
    id?: RPCID;
    result?: T;
    error?: RPCErrorObject<E>;
}
export declare abstract class BaseRPC {
    readonly canSubscribe: boolean;
    constructor(canSubscribe?: boolean);
    createID(): string;
    abstract request<P = any, R = any>(method: string, params?: P): Promise<R>;
}
