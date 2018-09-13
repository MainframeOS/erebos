// @flow

import type RPC from '@mainframe/rpc-base'

export type ClientConfig = {
  http?: string,
  ipc?: string,
  rpc?: RPC,
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
  _rpc: ?RPC

  constructor(config?: ClientConfig = {}) {
    this._rpc = config.rpc
  }

  get rpc(): RPC {
    if (this._rpc == null) {
      throw new Error(
        'Could not access RPC: missing in configuration provided to client',
      )
    }
    return this._rpc
  }

  disconnect() {
    // $FlowFixMe: disconnect method is only present in StreamRPC
    if (this._rpc != null && typeof this._rpc.disconnect === 'function') {
      this._rpc.disconnect()
    }
  }
}
