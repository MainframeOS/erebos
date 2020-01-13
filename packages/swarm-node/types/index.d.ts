import { BzzNode, BzzConfig } from '@erebos/bzz-node';
import { BaseClient, ClientConfig } from '@erebos/client-base';
import { Pss } from '@erebos/pss';
import { StreamRPC } from '@erebos/rpc-stream';
import { Response } from 'node-fetch';
export { BzzNode } from '@erebos/bzz-node';
export { Pss } from '@erebos/pss';
export { Hex } from '@erebos/hex';
export { createRPC } from '@erebos/rpc-node';
export interface SwarmConfig extends ClientConfig {
    bzz?: BzzConfig<Response> | BzzNode;
    pss?: string | Pss;
    rpc?: StreamRPC;
}
export declare class SwarmClient extends BaseClient {
    protected bzzInstance: BzzNode | void;
    protected pssInstance: Pss | void;
    constructor(config: SwarmConfig);
    get bzz(): BzzNode;
    get pss(): Pss;
}
