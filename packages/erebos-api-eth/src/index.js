// @flow

import type {
  RPC,
  hex,
  blockIndex,
  EthBlock,
  EthTransaction,
  EthTransactionReceipt,
  EthFilterOptions,
  EthLog,
  EthFilterResults,
} from './types'

export default class Eth {
  _rpc: RPC

  constructor(rpc: RPC) {
    this._rpc = rpc
  }

  protocolVersion(): Promise<string> {
    return this._rpc.request('eth_protocolVersion')
  }

  syncing(): Promise<Object | false> {
    return this._rpc.request('eth_syncing')
  }

  coinbase(): Promise<hex> {
    return this._rpc.request('eth_coinbase')
  }

  mining(): Promise<boolean> {
    return this._rpc.request('eth_mining')
  }

  hashrate(): Promise<hex> {
    return this._rpc.request('eth_hashrate')
  }

  gasPrice(): Promise<hex> {
    return this._rpc.request('eth_gasPrice')
  }

  accounts(): Promise<Array<hex>> {
    return this._rpc.request('eth_accounts')
  }

  blockNumber(): Promise<hex> {
    return this._rpc.request('eth_blockNumber')
  }

  getBalance(address: hex, block: blockIndex): Promise<hex> {
    return this._rpc.request('eth_getBalance', [address, block])
  }

  getStorageAt(address: hex, position: hex, block: blockIndex): Promise<hex> {
    return this._rpc.request('eth_getStorageAt', [address, position, block])
  }

  getTransactionCount(address: hex, block: blockIndex): Promise<hex> {
    return this._rpc.request('eth_getTransactionCount', [address, block])
  }

  getBlockTransactionCountByHash(hash: hex): Promise<hex> {
    return this._rpc.request('eth_getBlockTransactionCountByHash', [hash])
  }

  getBlockTransactionCountByNumber(block: blockIndex): Promise<hex> {
    return this._rpc.request('eth_getBlockTransactionCountByNumber', [block])
  }

  getUncleCountByBlockHash(hash: hex): Promise<hex> {
    return this._rpc.request('eth_getUncleCountByBlockHash', [hash])
  }

  getUncleCountByBlockNumber(block: blockIndex): Promise<hex> {
    return this._rpc.request('eth_getUncleCountByBlockNumber', [block])
  }

  getCode(address: hex, block: blockIndex): Promise<hex> {
    return this._rpc.request('eth_getCode', [address, block])
  }

  sign(address: hex, message: hex): Promise<hex> {
    return this._rpc.request('eth_sign', [address, message])
  }

  sendTransaction(transaction: {
    from: hex,
    to?: hex,
    gas?: hex,
    gasPrice?: hex,
    value?: hex,
    data: hex,
    nonce?: hex,
  }): Promise<hex> {
    return this._rpc.request('eth_sendTransaction', [transaction])
  }

  sendRawTransaction(data: hex): Promise<hex> {
    return this._rpc.request('eth_sendRawTransaction', [data])
  }

  call(
    transaction: {
      from?: hex,
      to: hex,
      gas?: hex,
      gasPrice?: hex,
      value?: hex,
      data?: hex,
    },
    block: blockIndex,
  ): Promise<hex> {
    return this._rpc.request('eth_call', [transaction, block])
  }

  estimateGas(transaction: {
    from?: hex,
    to?: hex,
    gas?: hex,
    gasPrice?: hex,
    value?: hex,
    data?: hex,
  }): Promise<hex> {
    return this._rpc.request('eth_estimateGas', [transaction])
  }

  getBlockByHash(hash: hex, full: boolean): Promise<?EthBlock> {
    return this._rpc.request('eth_getBlockByHash', [hash, full])
  }

  getBlockByNumber(block: blockIndex, full: boolean): Promise<?EthBlock> {
    return this._rpc.request('eth_getBlockByNumber', [block, full])
  }

  getTransactionByHash(hash: hex): Promise<?EthTransaction> {
    return this._rpc.request('eth_getTransactionByHash', [hash])
  }

  getTransactionByBlockHashAndIndex(
    hash: hex,
    index: hex,
  ): Promise<?EthTransaction> {
    return this._rpc.request('eth_getTransactionByBlockHashAndIndex', [
      hash,
      index,
    ])
  }

  getTransactionByBlockNumberAndIndex(
    block: blockIndex,
    index: hex,
  ): Promise<?EthTransaction> {
    return this._rpc.request('eth_getTransactionByBlockNumberAndIndex', [
      block,
      index,
    ])
  }

  getTransactionReceipt(hash: hex): Promise<?EthTransactionReceipt> {
    return this._rpc.request('eth_getTransactionReceipt', [hash])
  }

  getUncleByBlockHashAndIndex(hash: hex, index: hex): Promise<?EthBlock> {
    return this._rpc.request('eth_getUncleByBlockHashAndIndex', [hash, index])
  }

  getUncleByBlockNumberAndIndex(
    block: blockIndex,
    index: hex,
  ): Promise<?EthBlock> {
    return this._rpc.request('eth_getUncleByBlockNumberAndIndex', [
      block,
      index,
    ])
  }

  getCompilers(): Promise<Array<string>> {
    return this._rpc.request('eth_getCompilers')
  }

  compileSolidity(code: string): Promise<hex> {
    return this._rpc.request('eth_compileSolidity', [code])
  }

  compileLLL(code: string): Promise<hex> {
    return this._rpc.request('eth_compileLLL', [code])
  }

  compileSerpent(code: string): Promise<hex> {
    return this._rpc.request('eth_compileSerpent', [code])
  }

  newFilter(options: EthFilterOptions): Promise<hex> {
    return this._rpc.request('eth_newFilter', [options])
  }

  newBlockFilter(): Promise<hex> {
    return this._rpc.request('eth_newBlockFilter')
  }

  newPendingTransactionFilter(): Promise<hex> {
    return this._rpc.request('eth_newPendingTransactionFilter')
  }

  uninstallFilter(id: hex): Promise<boolean> {
    return this._rpc.request('eth_uninstallFilter', [id])
  }

  getFilterChanges(id: hex): Promise<EthFilterResults> {
    return this._rpc.request('eth_getFilterChanges', [id])
  }

  getFilterLogs(id: hex): Promise<EthFilterResults> {
    return this._rpc.request('eth_getFilterLogs', [id])
  }

  getLogs(options: EthFilterOptions): Promise<Array<EthLog>> {
    return this._rpc.request('eth_getLogs', [options])
  }

  getWork(): Promise<[hex, hex, hex]> {
    return this._rpc.request('eth_getWork')
  }

  submitWork(nonce: hex, hash: hex, digest: hex): Promise<boolean> {
    return this._rpc.request('eth_usubmitWork', [nonce, hash, digest])
  }

  submitHashrate(hashRate: hex, id: hex): Promise<boolean> {
    return this._rpc.request('eth_submitHashrate', [hashRate, id])
  }
}
