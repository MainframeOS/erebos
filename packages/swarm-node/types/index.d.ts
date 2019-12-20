import { Bzz, BzzConfig } from '@erebos/api-bzz-node';
import { Pss } from '@erebos/api-pss';
import { BaseClient, ClientConfig } from '@erebos/client-base';
import { StreamRPC } from '@erebos/rpc-stream';
export { Bzz } from '@erebos/api-bzz-node';
export { Pss } from '@erebos/api-pss';
export { Hex, hexInput, hexValue } from '@erebos/hex';
export { createRPC } from '@erebos/rpc-node';
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
