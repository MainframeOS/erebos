// @flow

import { BzzAPI, EthAPI, NetAPI, PssAPI, ShhAPI, Web3API } from './api'
import rpc, { httpRPC, ipcRPC, webSocketRPC } from './rpc'

import type RPC from './rpc/BaseRPC'
import type { ClientConfig } from './types'

function instantiateAPI<T>(maybeInstance: ?(string | T), Cls: Class<T>): ?T {
  if (maybeInstance != null) {
    return maybeInstance instanceof Cls
      ? maybeInstance
      : // $FlowFixMe
        new Cls(rpc(maybeInstance))
  }
}

export default class Client {
  _bzz: ?BzzAPI
  _eth: ?EthAPI
  _http: ?string
  _net: ?NetAPI
  _pss: ?PssAPI
  _rpc: RPC
  _shh: ?ShhAPI
  _web3: ?Web3API

  constructor(config: string | ClientConfig) {
    if (typeof config === 'string') {
      this._rpc = rpc(config)
    } else {
      this._http = config.http

      this._bzz = instantiateAPI(config.bzz, BzzAPI)
      this._eth = instantiateAPI(config.eth, EthAPI)
      this._net = instantiateAPI(config.net, NetAPI)
      this._pss = instantiateAPI(config.pss, PssAPI)
      this._shh = instantiateAPI(config.shh, ShhAPI)
      this._web3 = instantiateAPI(config.web3, Web3API)

      if (config.rpc == null) {
        if (config.ipc != null) {
          this._rpc =
            typeof config.ipc === 'string' ? ipcRPC(config.ipc) : config.ipc
        } else if (config.ws != null) {
          this._rpc = webSocketRPC(config.ws)
        } else if (config.http != null) {
          this._rpc = httpRPC(config.http)
        }
      } else {
        this._rpc = config.rpc
      }
    }
  }

  get rpc(): RPC {
    if (this._rpc == null) {
      throw new Error(
        'Could not access rpc: missing "rpc", "http", "ipc" or "ws" parameter provided to client',
      )
    }
    return this._rpc
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

  get eth(): EthAPI {
    if (this._eth == null) {
      this._eth = new EthAPI(this.rpc)
    }
    return this._eth
  }

  get net(): NetAPI {
    if (this._net == null) {
      this._net = new NetAPI(this.rpc)
    }
    return this._net
  }

  get pss(): PssAPI {
    if (this._pss == null) {
      // $FlowFixMe: runtime check
      this._pss = new PssAPI(this.rpc)
    }
    return this._pss
  }

  get shh(): ShhAPI {
    if (this._shh == null) {
      this._shh = new ShhAPI(this.rpc)
    }
    return this._shh
  }

  get web3(): Web3API {
    if (this._web3 == null) {
      this._web3 = new Web3API(this.rpc)
    }
    return this._web3
  }
}
