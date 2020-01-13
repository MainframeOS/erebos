import { Response } from '@erebos/bzz';
import { BzzBrowser, BzzConfig } from '@erebos/bzz-browser';
import { BaseClient, ClientConfig } from '@erebos/client-base';
import { Pss } from '@erebos/pss';
import { StreamRPC } from '@erebos/rpc-stream';
export { BzzBrowser } from '@erebos/bzz-browser';
export { Pss } from '@erebos/pss';
export { Hex } from '@erebos/hex';
export { createRPC } from '@erebos/rpc-browser';
declare type Res = Response<ReadableStream<Uint8Array>>;
export interface SwarmConfig extends ClientConfig {
    bzz?: BzzBrowser | BzzConfig<Res>;
    pss?: string | Pss;
    rpc?: StreamRPC;
}
export declare class SwarmClient extends BaseClient {
    protected bzzInstance: BzzBrowser | void;
    protected pssInstance: Pss | void;
    constructor(config: SwarmConfig);
    get bzz(): BzzBrowser;
    get pss(): Pss;
}
