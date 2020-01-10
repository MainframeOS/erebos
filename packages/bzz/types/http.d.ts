import { Response } from './types';
export declare class HTTPError extends Error {
    status: number;
    constructor(status: number, message: string);
}
export declare function resOrError<R extends Response>(res: R): Promise<R>;
export declare function resJSON<R extends Response, T = any>(res: R): Promise<T>;
export declare function resStream<S, R extends Response<S>>(res: R): Promise<S>;
export declare function resText<R extends Response>(res: R): Promise<string>;
export declare function resArrayBuffer<R extends Response>(res: R): Promise<ArrayBuffer>;
export declare function resSwarmHash<R extends Response>(res: R): Promise<string>;
