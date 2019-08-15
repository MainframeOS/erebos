import { createRPC as createHTTP } from '@erebos/rpc-http-browser';
import { createRPC as createWS } from '@erebos/rpc-ws-browser';
export declare function createRPC(endpoint: string): ReturnType<typeof createHTTP> | ReturnType<typeof createWS>;
