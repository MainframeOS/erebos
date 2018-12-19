// @flow

import createRPC, { ipcRPC, wsRPC } from '@mainframe/rpc-node'
import StreamRPC from '@mainframe/rpc-stream'
import type { BzzConfig } from '@erebos/api-bzz-base'
import BzzAPI from '@erebos/api-bzz-node'
import PssAPI from '@erebos/api-pss'
import BaseClient, {
  createInstantiateAPI,
  type ClientConfig,
} from '@erebos/client-base'

const instantiateAPI = createInstantiateAPI(createRPC)

export type SwarmConfig = ClientConfig & {
  bzz?: BzzConfig | BzzAPI,
  pss?: string | PssAPI,
  rpc?: StreamRPC,
}

export default class NodeClient extends BaseClient {
  _bzz: ?BzzAPI
  _pss: ?PssAPI

  constructor(config: SwarmConfig) {
    if (config.rpc == null) {
      if (config.ipc != null) {
        config.rpc = ipcRPC(config.ipc)
      } else if (config.ws != null) {
        config.rpc = wsRPC(config.ws)
      }
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
