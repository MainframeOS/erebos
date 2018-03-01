// @flow

import type RPC from '../rpc/BaseRPC'
import type { hex } from '../types'

export default class Net {
  _rpc: RPC

  constructor(rpc: RPC) {
    this._rpc = rpc
  }

  version(): Promise<string> {
    return this._rpc.request('net_version')
  }

  listening(): Promise<boolean> {
    return this._rpc.request('net_listening')
  }

  peerCount(): Promise<hex> {
    return this._rpc.request('net_peerCount')
  }
}
