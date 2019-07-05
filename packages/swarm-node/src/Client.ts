import createRPC, { ipcRPC, wsRPC } from '@mainframe/rpc-node'
import StreamRPC from '@mainframe/rpc-stream'
import { BzzConfig } from '@erebos/api-bzz-base'
import { BzzNode } from '@erebos/api-bzz-node'
import { Pss } from '@erebos/api-pss'
import {
  ClientBase,
  ClientConfig,
  createInstantiateAPI,
} from '@erebos/client-base'

const instantiateAPI = createInstantiateAPI(createRPC as (
  endpoint: string,
) => StreamRPC)

export interface SwarmConfig extends ClientConfig {
  bzz?: BzzConfig | BzzNode
  pss?: string | Pss
  rpc?: StreamRPC
}

export class SwarmClient extends ClientBase<BzzNode> {
  public constructor(config: SwarmConfig) {
    if (config.rpc == null) {
      if (config.ipc != null) {
        config.rpc = ipcRPC(config.ipc)
      } else if (config.ws != null) {
        config.rpc = wsRPC(config.ws)
      }
    }
    super(config)

    if (config.bzz != null) {
      if (config.bzz instanceof BzzNode) {
        this.bzzInstance = config.bzz
      } else {
        this.bzzInstance = new BzzNode(config.bzz)
      }
    } else if (typeof config.http === 'string') {
      this.bzzInstance = new BzzNode({ url: config.http })
    }

    this.pssInstance = instantiateAPI(config.pss, Pss)
  }
}
