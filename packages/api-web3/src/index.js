// @flow

import type { hexValue } from '@erebos/hex'
import type RPC from '@mainframe/rpc-base'

export default class Web3 {
  _rpc: RPC

  constructor(rpc: RPC) {
    this._rpc = rpc
  }

  clientVersion(): Promise<string> {
    return this._rpc.request('web3_clientVersion')
  }

  sha3(data: hexValue): Promise<hexValue> {
    return this._rpc.request('web3_sha3', data)
  }
}
