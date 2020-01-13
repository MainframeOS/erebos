import { BzzNode, BzzConfig } from '@erebos/bzz-node'
import {
  BaseClient,
  ClientConfig,
  createInstantiateAPI,
} from '@erebos/client-base'
import { Pss } from '@erebos/pss'
import { createRPC as createIPC } from '@erebos/rpc-ipc'
import { createRPC } from '@erebos/rpc-node'
import { StreamRPC } from '@erebos/rpc-stream'
import { createRPC as createWS } from '@erebos/rpc-ws-node'
import { Response } from 'node-fetch'

// Re-exports from imported libraries
export { BzzNode } from '@erebos/bzz-node'
export { Pss } from '@erebos/pss'
export { Hex } from '@erebos/hex'
export { createRPC } from '@erebos/rpc-node'

const instantiateAPI = createInstantiateAPI(
  createRPC as (endpoint: string) => StreamRPC,
)

export interface SwarmConfig extends ClientConfig {
  bzz?: BzzConfig<Response> | BzzNode
  pss?: string | Pss
  rpc?: StreamRPC
}

export class SwarmClient extends BaseClient {
  protected bzzInstance: BzzNode | void = undefined
  protected pssInstance: Pss | void = undefined

  public constructor(config: SwarmConfig) {
    super(config)

    if (config.rpc == null) {
      if (config.ipc != null) {
        this.rpcInstance = createIPC(config.ipc)
      } else if (config.ws != null) {
        this.rpcInstance = createWS(config.ws)
      }
    }

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

  public get bzz(): BzzNode {
    if (this.bzzInstance == null) {
      throw new Error('Missing Bzz instance or HTTP URL')
    }
    return this.bzzInstance
  }

  public get pss(): Pss {
    if (this.pssInstance == null) {
      this.pssInstance = new Pss(this.rpc)
    }
    return this.pssInstance
  }
}
