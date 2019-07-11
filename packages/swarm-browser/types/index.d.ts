import StreamRPC from '@mainframe/rpc-stream';
import { Bzz, BzzConfig } from '@erebos/api-bzz-browser';
import { Pss } from '@erebos/api-pss';
import { BaseClient, ClientConfig } from '@erebos/client-base';
export { Bzz } from '@erebos/api-bzz-browser';
export { Pss } from '@erebos/api-pss';
export { Hex, createHex } from '@erebos/hex';
export { default as createRPC } from '@mainframe/rpc-browser';
export interface SwarmConfig extends ClientConfig {
    bzz?: BzzConfig | Bzz;
    pss?: string | Pss;
    rpc?: StreamRPC;
}
export declare class SwarmClient extends BaseClient {
    protected bzzInstance: Bzz | void;
    protected pssInstance: Pss | void;
    constructor(config: SwarmConfig);
    readonly bzz: Bzz;
    readonly pss: Pss;
}
