import { RPCRequest, RPCResponse } from '@erebos/rpc-base';
export declare type ErrorHandler = <C = any, P = any>(ctx: C, req: RPCRequest<P>, error: Error) => void;
export declare type MethodHandler = <C = any, P = any, R = any>(ctx: C, params: P) => R | Promise<R>;
export declare type NotificationHandler = <C = any, P = any>(ctx: C, req: RPCRequest<P>) => void;
declare type ValidationSchema = Record<string, any>;
export interface MethodWithParams {
    params?: ValidationSchema | undefined;
    handler: MethodHandler;
}
export declare type Methods = Record<string, MethodHandler | MethodWithParams>;
declare type NormalizedMethods = Record<string, MethodHandler>;
export interface HandlerParams {
    methods: Methods;
    onHandlerError?: ErrorHandler | undefined;
    onInvalidMessage?: NotificationHandler | undefined;
    onNotification?: NotificationHandler | undefined;
    validatorOptions?: any | undefined;
}
export declare type HandlerFunc = <C = any, P = any, R = any, E = any>(ctx: C, req: RPCRequest<P>) => Promise<RPCResponse<R, E>>;
export declare function parseJSON<T = any>(input: string): T;
export declare function createErrorResponse<R, E>(id: number | string, code: number): RPCResponse<R, E>;
export declare function normalizeMethods(methods: Methods, validatorOptions?: any | undefined): NormalizedMethods;
export declare function createHandler(params: HandlerParams): <C = any, P = any, R = any, E = any>(ctx: C, msg: RPCRequest<P>) => Promise<RPCResponse<R, E> | null>;
export {};
