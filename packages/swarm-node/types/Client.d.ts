import StreamRPC from '@mainframe/rpc-stream';
import { BzzConfig } from '@erebos/api-bzz-base';
import { BzzNode } from '@erebos/api-bzz-node';
import { Pss } from '@erebos/api-pss';
import { ClientBase, ClientConfig } from '@erebos/client-base';
export interface SwarmConfig extends ClientConfig {
    bzz?: BzzConfig | BzzNode;
    pss?: string | Pss;
    rpc?: StreamRPC;
}
export declare class SwarmClient extends ClientBase<BzzNode> {
    constructor(config: SwarmConfig);
}
