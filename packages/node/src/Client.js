// @flow

import createRPC, { httpRPC, ipcRPC, wsRPC } from '@mainframe/rpc-node'
import BzzAPI from '@erebos/api-bzz-node'
import BaseClient, {
  createInstantiateAPI,
  type ClientConfig, // eslint-disable-line import/named
} from '@erebos/client-base'

const instantiateAPI = createInstantiateAPI(createRPC)

export default class NodeClient extends BaseClient {
  _bzz: ?BzzAPI

  constructor(config: string | ClientConfig) {
    if (typeof config === 'string') {
      super({ rpc: createRPC(config) }, instantiateAPI)
    } else {
      if (config.rpc == null) {
        if (config.ipc != null) {
          config.rpc = ipcRPC(config.ipc)
        } else if (config.ws != null) {
          config.rpc = wsRPC(config.ws)
        } else if (config.http != null) {
          config.rpc = httpRPC(config.http)
        }
      }

      super(config, instantiateAPI)

      if (config.bzz != null) {
        if (config.bzz instanceof BzzAPI) {
          this._bzz = config.bzz
        } else if (typeof config.bzz === 'string') {
          this._bzz = new BzzAPI(config.bzz)
        }
      }
    }
  }

  get bzz(): BzzAPI {
    if (this._bzz == null) {
      throw new Error('Missing Bzz instance or HTTP URL')
    }
    return this._bzz
  }
}
