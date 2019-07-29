import createRPC, { ipcRPC, wsRPC } from '@mainframe/rpc-node'
import StreamRPC from '@mainframe/rpc-stream'
import { Bzz, BzzConfig } from '@erebos/api-bzz-node'
import { Pss } from '@erebos/api-pss'
import {
  BaseClient,
  ClientConfig,
  createInstantiateAPI,
} from '@erebos/client-base'

// Re-exports from imported libraries
export { Bzz } from '@erebos/api-bzz-node'
export { Pss } from '@erebos/api-pss'
export { Hex, createHex, hexInput, hexValue } from '@erebos/hex'
export { default as createRPC } from '@mainframe/rpc-node'

const instantiateAPI = createInstantiateAPI(createRPC as (
  endpoint: string,
) => StreamRPC)

export interface SwarmConfig extends ClientConfig {
  bzz?: BzzConfig | Bzz
  pss?: string | Pss
  rpc?: StreamRPC
}

export class SwarmClient extends BaseClient {
  protected bzzInstance: Bzz | void = undefined
  protected pssInstance: Pss | void = undefined

  public constructor(config: SwarmConfig) {
    super(config)

    if (config.rpc == null) {
      if (config.ipc != null) {
        this.rpcInstance = ipcRPC(config.ipc)
      } else if (config.ws != null) {
        this.rpcInstance = wsRPC(config.ws)
      }
    }

    if (config.bzz != null) {
      if (config.bzz instanceof Bzz) {
        this.bzzInstance = config.bzz
      } else {
        this.bzzInstance = new Bzz(config.bzz)
      }
    } else if (typeof config.http === 'string') {
      this.bzzInstance = new Bzz({ url: config.http })
    }

    this.pssInstance = instantiateAPI(config.pss, Pss)
  }

  public get bzz(): Bzz {
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
