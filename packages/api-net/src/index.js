// @flow

import type { hexValue } from '@erebos/hex'
import type RPC from '@mainframe/rpc-base'

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

  peerCount(): Promise<hexValue> {
    return this._rpc.request('net_peerCount')
  }
}
