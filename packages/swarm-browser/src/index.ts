import { Bzz, BzzConfig } from '@erebos/api-bzz-browser'
import { Pss } from '@erebos/api-pss'
import {
  BaseClient,
  ClientConfig,
  createInstantiateAPI,
} from '@erebos/client-base'
import { createRPC } from '@erebos/rpc-browser'
import { StreamRPC } from '@erebos/rpc-stream'
import { createRPC as createWS } from '@erebos/rpc-ws-browser'

// Re-exports from imported libraries
export { Bzz } from '@erebos/api-bzz-browser'
export { Pss } from '@erebos/api-pss'
export { Hex, createHex } from '@erebos/hex'
export { createRPC } from '@erebos/rpc-browser'

// Exporting internal tooling that might be handy
export { Buffer } from 'buffer'
export { Readable } from 'readable-stream'

export interface SwarmConfig extends ClientConfig {
  bzz?: BzzConfig | Bzz
  pss?: string | Pss
  rpc?: StreamRPC
}

const instantiateAPI = createInstantiateAPI(
  createRPC as (endpoint: string) => StreamRPC,
)

export class SwarmClient extends BaseClient {
  protected bzzInstance: Bzz | void = undefined
  protected pssInstance: Pss | void = undefined

  public constructor(config: SwarmConfig) {
    super(config)

    if (config.rpc == null && config.ws != null) {
      this.rpcInstance = createWS(config.ws)
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
