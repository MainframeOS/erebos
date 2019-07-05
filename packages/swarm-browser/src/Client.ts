import createRPC, { wsRPC } from '@mainframe/rpc-browser'
import StreamRPC from '@mainframe/rpc-stream'
import { BzzConfig } from '@erebos/api-bzz-base'
import { BzzBrowser } from '@erebos/api-bzz-browser'
import { Pss } from '@erebos/api-pss'
import {
  ClientBase,
  ClientConfig,
  createInstantiateAPI,
} from '@erebos/client-base'

export interface SwarmConfig extends ClientConfig {
  bzz?: BzzConfig | BzzBrowser
  pss?: string | Pss
  rpc?: StreamRPC
}

const instantiateAPI = createInstantiateAPI(createRPC as (
  endpoint: string,
) => StreamRPC)

export class SwarmClient extends ClientBase<BzzBrowser> {
  public constructor(config: SwarmConfig) {
    if (config.rpc == null && config.ws != null) {
      config.rpc = wsRPC(config.ws)
    }
    super(config)

    if (config.bzz != null) {
      if (config.bzz instanceof BzzBrowser) {
        this.bzzInstance = config.bzz
      } else {
        this.bzzInstance = new BzzBrowser(config.bzz)
      }
    } else if (typeof config.http === 'string') {
      this.bzzInstance = new BzzBrowser({ url: config.http })
    }

    this.pssInstance = instantiateAPI(config.pss, Pss)
  }
}
