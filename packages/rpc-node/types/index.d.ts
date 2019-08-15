import { createRPC as createHTTP } from '@erebos/rpc-http-node';
import { createRPC as createIPC } from '@erebos/rpc-ipc';
import { createRPC as createWS } from '@erebos/rpc-ws-node';
declare type RPC = ReturnType<typeof createHTTP> | ReturnType<typeof createIPC> | ReturnType<typeof createWS>;
export declare function createRPC(endpoint: string): RPC;
export {};
