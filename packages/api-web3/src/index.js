// @flow

import type RPC from '@mainframe/rpc-base'
import type { hex } from '@mainframe/utils-hex'

export default class Web3 {
  _rpc: RPC

  constructor(rpc: RPC) {
    this._rpc = rpc
  }

  clientVersion(): Promise<string> {
    return this._rpc.request('web3_clientVersion')
  }

  sha3(data: hex): Promise<hex> {
    return this._rpc.request('web3_sha3', data)
  }
}
