// @flow

import type RPC from '../rpc/BaseRPC'
import type { hex } from '../types'

export default class Web3 {
  _rpc: RPC

  constructor(rpc: RPC) {
    this._rpc = rpc
  }

  clientVersion(): Promise<string> {
    return this._rpc.request('web3_clientVersion')
  }

  sha3(data: hex): Promise<hex> {
    return this._rpc.request('web3_sha3')
  }
}
