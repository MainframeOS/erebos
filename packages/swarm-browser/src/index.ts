import { Bzz, Response } from '@erebos/bzz'
import { BzzBrowser, BzzConfig } from '@erebos/bzz-browser'
import {
  BaseClient,
  ClientConfig,
  createInstantiateAPI,
} from '@erebos/client-base'
import { Pss } from '@erebos/pss'
import { createRPC } from '@erebos/rpc-browser'
import { StreamRPC } from '@erebos/rpc-stream'
import { createRPC as createWS } from '@erebos/rpc-ws-browser'

// Re-exports from imported libraries
export { BzzBrowser } from '@erebos/bzz-browser'
export { Pss } from '@erebos/pss'
export { Hex } from '@erebos/hex'
export { createRPC } from '@erebos/rpc-browser'

type Res = Response<ReadableStream<Uint8Array>>

const instantiateAPI = createInstantiateAPI(
  createRPC as (endpoint: string) => StreamRPC,
)

export interface SwarmConfig extends ClientConfig {
  bzz?: BzzBrowser | BzzConfig<Res>
  pss?: string | Pss
  rpc?: StreamRPC
}

export class SwarmClient extends BaseClient {
  protected bzzInstance: BzzBrowser | void = undefined
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
        this.bzzInstance = new BzzBrowser(config.bzz)
      }
    } else if (typeof config.http === 'string') {
      this.bzzInstance = new BzzBrowser({ url: config.http })
    }

    this.pssInstance = instantiateAPI(config.pss, Pss)
  }

  public get bzz(): BzzBrowser {
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
