// @flow

import createRPC, { httpRPC, wsRPC } from '@mainframe/rpc-browser'
import BzzAPI from '@erebos/api-bzz-browser'
import BaseClient, {
  createInstantiateAPI,
  type ClientConfig, // eslint-disable-line import/named
} from '@erebos/client-base'

const instantiateAPI = createInstantiateAPI(createRPC)

export default class BrowserClient extends BaseClient {
  _bzz: ?BzzAPI

  constructor(config?: string | ClientConfig) {
    if (config == null || typeof config === 'string') {
      super({ rpc: createRPC(config) }, instantiateAPI)
    } else {
      if (config.rpc == null) {
        if (config.ws != null) {
          config.rpc = wsRPC(config.ws)
        } else if (config.http != null) {
          config.rpc = httpRPC(config.http)
        }
      }
      super(config, instantiateAPI)
      // $FlowFixMe: instance type
      this._bzz = instantiateAPI(config.bzz, BzzAPI)
    }
  }

  get bzz(): BzzAPI {
    if (this._bzz == null) {
      if (this._http == null) {
        throw new Error('Missing Bzz instance or HTTP URL')
      }
      this._bzz = new BzzAPI(this._http)
    }
    return this._bzz
  }
}
