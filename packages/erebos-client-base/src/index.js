// @flow

import type RPC from '@mainframe/rpc-base'
import type BzzAPI from 'erebos-api-bzz-base'
import EthAPI from 'erebos-api-eth'
import NetAPI from 'erebos-api-net'
import PssAPI from 'erebos-api-pss'
import ShhAPI from 'erebos-api-shh'
import Web3API from 'erebos-api-web3'

export type ClientConfig = {
  bzz?: string | BzzAPI,
  eth?: string | EthAPI,
  http?: string,
  ipc?: string,
  net?: string | NetAPI,
  pss?: string | PssAPI,
  rpc?: RPC,
  shh?: string | ShhAPI,
  web3?: string | Web3API,
  ws?: string,
}

export type InstantiateAPI<T> = (
  maybeInstance: ?(string | T),
  Cls: Class<T>,
) => ?T

export const createInstantiateAPI = (createRPC: Function) => {
  return function instantiateAPI<T: *>(
    maybeInstance: ?(string | T),
    Cls: Class<T>,
  ): ?T {
    if (maybeInstance != null) {
      return maybeInstance instanceof Cls
        ? maybeInstance
        : // $FlowFixMe: instance type
          new Cls(createRPC(maybeInstance))
    }
  }
}

export default class BaseClient {
  _eth: ?EthAPI
  _http: ?string
  _net: ?NetAPI
  _pss: ?PssAPI
  _rpc: ?RPC
  _shh: ?ShhAPI
  _web3: ?Web3API

  constructor(config: ClientConfig, instantiateAPI: InstantiateAPI<*>) {
    this._http = config.http
    this._rpc = config.rpc
    // $FlowFixMe: instance type
    this._eth = instantiateAPI(config.eth, EthAPI)
    // $FlowFixMe: instance type
    this._net = instantiateAPI(config.net, NetAPI)
    // $FlowFixMe: instance type
    this._pss = instantiateAPI(config.pss, PssAPI)
    // $FlowFixMe: instance type
    this._shh = instantiateAPI(config.shh, ShhAPI)
    // $FlowFixMe: instance type
    this._web3 = instantiateAPI(config.web3, Web3API)
  }

  get rpc(): RPC {
    if (this._rpc == null) {
      throw new Error(
        'Could not access rpc: missing "rpc", "http", "ipc" or "ws" parameter provided to client',
      )
    }
    return this._rpc
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
