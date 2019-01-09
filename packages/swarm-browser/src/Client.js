// @flow

import createRPC, { wsRPC } from '@mainframe/rpc-browser'
import StreamRPC from '@mainframe/rpc-stream'
import type { BzzConfig } from '@erebos/api-bzz-base'
import BzzAPI from '@erebos/api-bzz-browser'
import PssAPI from '@erebos/api-pss'
import BaseClient, {
  createInstantiateAPI,
  type ClientConfig,
} from '@erebos/client-base'

export type SwarmConfig = ClientConfig & {
  bzz?: BzzConfig | BzzAPI,
  pss?: string | PssAPI,
  rpc?: StreamRPC,
}

const instantiateAPI = createInstantiateAPI(createRPC)

export default class BrowserClient extends BaseClient {
  _bzz: ?BzzAPI
  _pss: ?PssAPI

  constructor(config: SwarmConfig) {
    if (config.rpc == null && config.ws != null) {
      config.rpc = wsRPC(config.ws)
    }
    super(config)

    if (config.bzz != null) {
      if (config.bzz instanceof BzzAPI) {
        this._bzz = config.bzz
      } else {
        this._bzz = new BzzAPI(config.bzz)
      }
    } else if (typeof config.http === 'string') {
      this._bzz = new BzzAPI({ url: config.http })
    }

    // $FlowFixMe: instance type
    this._pss = instantiateAPI(config.pss, PssAPI)
  }

  get bzz(): BzzAPI {
    if (this._bzz == null) {
      throw new Error('Missing Bzz instance or HTTP URL')
    }
    return this._bzz
  }

  get pss(): PssAPI {
    if (this._pss == null) {
      this._pss = new PssAPI(this.rpc)
    }
    return this._pss
  }
}
