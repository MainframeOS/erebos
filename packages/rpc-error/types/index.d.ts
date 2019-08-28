import { RPCErrorObject } from '@erebos/rpc-base';
export declare enum ERROR_CODE {
    PARSE_ERROR = -32700,
    INVALID_REQUEST = -32600,
    METHOD_NOT_FOUND = -32601,
    INVALID_PARAMS = -32602,
    INTERNAL_ERROR = -32603
}
export declare const ERROR_MESSAGE: Record<number, string>;
export declare function isServerError(code: number): boolean;
export declare function getErrorMessage(code: number): string;
export declare class RPCError<T = any> extends Error {
    static fromObject<D = any>(err: RPCErrorObject<D>): RPCError<D>;
    code: number;
    data: T | undefined;
    message: string;
    constructor(code: number, message?: string | undefined, data?: T | undefined);
    toObject(): RPCErrorObject<T>;
}
export declare const parseError: <T>(data?: T | undefined) => RPCError<T>;
export declare const invalidRequest: <T>(data?: T | undefined) => RPCError<T>;
export declare const methodNotFound: <T>(data?: T | undefined) => RPCError<T>;
export declare const invalidParams: <T>(data?: T | undefined) => RPCError<T>;
export declare const internalError: <T>(data?: T | undefined) => RPCError<T>;
