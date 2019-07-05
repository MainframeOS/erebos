import StreamRPC from '@mainframe/rpc-stream';
import { BzzConfig } from '@erebos/api-bzz-base';
import { BzzBrowser } from '@erebos/api-bzz-browser';
import { Pss } from '@erebos/api-pss';
import { ClientBase, ClientConfig } from '@erebos/client-base';
export interface SwarmConfig extends ClientConfig {
    bzz?: BzzConfig | BzzBrowser;
    pss?: string | Pss;
    rpc?: StreamRPC;
}
export declare class SwarmClient extends ClientBase<BzzBrowser> {
    constructor(config: SwarmConfig);
}
