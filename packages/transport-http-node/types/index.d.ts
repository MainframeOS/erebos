import { Response } from 'node-fetch';
export declare class HTTPError extends Error {
    status: number;
    constructor(status: number, message: string);
}
export declare function resOrError(res: Response): Response;
declare type RequestFunction = <D = any, R = any>(data: D) => Promise<R>;
export declare function createTransport(url: string): RequestFunction;
export {};
