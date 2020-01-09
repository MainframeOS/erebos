import { Bzz, BzzConfig } from '@erebos/api-bzz-browser';
import { Pss } from '@erebos/api-pss';
import { BaseClient, ClientConfig } from '@erebos/client-base';
import { StreamRPC } from '@erebos/rpc-stream';
export { Bzz } from '@erebos/api-bzz-browser';
export { Pss } from '@erebos/api-pss';
export { Hex, createHex } from '@erebos/hex';
export { createRPC } from '@erebos/rpc-browser';
export { Buffer } from 'buffer';
export { Readable } from 'readable-stream';
export interface SwarmConfig extends ClientConfig {
    bzz?: BzzConfig | Bzz;
    pss?: string | Pss;
    rpc?: StreamRPC;
}
export declare class SwarmClient extends BaseClient {
    protected bzzInstance: Bzz | void;
    protected pssInstance: Pss | void;
    constructor(config: SwarmConfig);
    get bzz(): Bzz;
    get pss(): Pss;
}
