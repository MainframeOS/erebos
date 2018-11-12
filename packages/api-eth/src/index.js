// @flow

import type { hexValue } from '@erebos/hex'

import type {
  RPC,
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

  coinbase(): Promise<hexValue> {
    return this._rpc.request('eth_coinbase')
  }

  mining(): Promise<boolean> {
    return this._rpc.request('eth_mining')
  }

  hashrate(): Promise<hexValue> {
    return this._rpc.request('eth_hashrate')
  }

  gasPrice(): Promise<hexValue> {
    return this._rpc.request('eth_gasPrice')
  }

  accounts(): Promise<Array<hexValue>> {
    return this._rpc.request('eth_accounts')
  }

  blockNumber(): Promise<hexValue> {
    return this._rpc.request('eth_blockNumber')
  }

  getBalance(address: hexValue, block: blockIndex): Promise<hexValue> {
    return this._rpc.request('eth_getBalance', [address, block])
  }

  getStorageAt(
    address: hexValue,
    position: hexValue,
    block: blockIndex,
  ): Promise<hexValue> {
    return this._rpc.request('eth_getStorageAt', [address, position, block])
  }

  getTransactionCount(address: hexValue, block: blockIndex): Promise<hexValue> {
    return this._rpc.request('eth_getTransactionCount', [address, block])
  }

  getBlockTransactionCountByHash(hash: hexValue): Promise<hexValue> {
    return this._rpc.request('eth_getBlockTransactionCountByHash', [hash])
  }

  getBlockTransactionCountByNumber(block: blockIndex): Promise<hexValue> {
    return this._rpc.request('eth_getBlockTransactionCountByNumber', [block])
  }

  getUncleCountByBlockHash(hash: hexValue): Promise<hexValue> {
    return this._rpc.request('eth_getUncleCountByBlockHash', [hash])
  }

  getUncleCountByBlockNumber(block: blockIndex): Promise<hexValue> {
    return this._rpc.request('eth_getUncleCountByBlockNumber', [block])
  }

  getCode(address: hexValue, block: blockIndex): Promise<hexValue> {
    return this._rpc.request('eth_getCode', [address, block])
  }

  sign(address: hexValue, message: hexValue): Promise<hexValue> {
    return this._rpc.request('eth_sign', [address, message])
  }

  sendTransaction(transaction: {
    from: hexValue,
    to?: hexValue,
    gas?: hexValue,
    gasPrice?: hexValue,
    value?: hexValue,
    data: hexValue,
    nonce?: hexValue,
  }): Promise<hexValue> {
    return this._rpc.request('eth_sendTransaction', [transaction])
  }

  sendRawTransaction(data: hexValue): Promise<hexValue> {
    return this._rpc.request('eth_sendRawTransaction', [data])
  }

  call(
    transaction: {
      from?: hexValue,
      to: hexValue,
      gas?: hexValue,
      gasPrice?: hexValue,
      value?: hexValue,
      data?: hexValue,
    },
    block: blockIndex,
  ): Promise<hexValue> {
    return this._rpc.request('eth_call', [transaction, block])
  }

  estimateGas(transaction: {
    from?: hexValue,
    to?: hexValue,
    gas?: hexValue,
    gasPrice?: hexValue,
    value?: hexValue,
    data?: hexValue,
  }): Promise<hexValue> {
    return this._rpc.request('eth_estimateGas', [transaction])
  }

  getBlockByHash(hash: hexValue, full: boolean): Promise<?EthBlock> {
    return this._rpc.request('eth_getBlockByHash', [hash, full])
  }

  getBlockByNumber(block: blockIndex, full: boolean): Promise<?EthBlock> {
    return this._rpc.request('eth_getBlockByNumber', [block, full])
  }

  getTransactionByHash(hash: hexValue): Promise<?EthTransaction> {
    return this._rpc.request('eth_getTransactionByHash', [hash])
  }

  getTransactionByBlockHashAndIndex(
    hash: hexValue,
    index: hexValue,
  ): Promise<?EthTransaction> {
    return this._rpc.request('eth_getTransactionByBlockHashAndIndex', [
      hash,
      index,
    ])
  }

  getTransactionByBlockNumberAndIndex(
    block: blockIndex,
    index: hexValue,
  ): Promise<?EthTransaction> {
    return this._rpc.request('eth_getTransactionByBlockNumberAndIndex', [
      block,
      index,
    ])
  }

  getTransactionReceipt(hash: hexValue): Promise<?EthTransactionReceipt> {
    return this._rpc.request('eth_getTransactionReceipt', [hash])
  }

  getUncleByBlockHashAndIndex(
    hash: hexValue,
    index: hexValue,
  ): Promise<?EthBlock> {
    return this._rpc.request('eth_getUncleByBlockHashAndIndex', [hash, index])
  }

  getUncleByBlockNumberAndIndex(
    block: blockIndex,
    index: hexValue,
  ): Promise<?EthBlock> {
    return this._rpc.request('eth_getUncleByBlockNumberAndIndex', [
      block,
      index,
    ])
  }

  getCompilers(): Promise<Array<string>> {
    return this._rpc.request('eth_getCompilers')
  }

  compileSolidity(code: string): Promise<hexValue> {
    return this._rpc.request('eth_compileSolidity', [code])
  }

  compileLLL(code: string): Promise<hexValue> {
    return this._rpc.request('eth_compileLLL', [code])
  }

  compileSerpent(code: string): Promise<hexValue> {
    return this._rpc.request('eth_compileSerpent', [code])
  }

  newFilter(options: EthFilterOptions): Promise<hexValue> {
    return this._rpc.request('eth_newFilter', [options])
  }

  newBlockFilter(): Promise<hexValue> {
    return this._rpc.request('eth_newBlockFilter')
  }

  newPendingTransactionFilter(): Promise<hexValue> {
    return this._rpc.request('eth_newPendingTransactionFilter')
  }

  uninstallFilter(id: hexValue): Promise<boolean> {
    return this._rpc.request('eth_uninstallFilter', [id])
  }

  getFilterChanges(id: hexValue): Promise<EthFilterResults> {
    return this._rpc.request('eth_getFilterChanges', [id])
  }

  getFilterLogs(id: hexValue): Promise<EthFilterResults> {
    return this._rpc.request('eth_getFilterLogs', [id])
  }

  getLogs(options: EthFilterOptions): Promise<Array<EthLog>> {
    return this._rpc.request('eth_getLogs', [options])
  }

  getWork(): Promise<[hexValue, hexValue, hexValue]> {
    return this._rpc.request('eth_getWork')
  }

  submitWork(
    nonce: hexValue,
    hash: hexValue,
    digest: hexValue,
  ): Promise<boolean> {
    return this._rpc.request('eth_usubmitWork', [nonce, hash, digest])
  }

  submitHashrate(hashRate: hexValue, id: hexValue): Promise<boolean> {
    return this._rpc.request('eth_submitHashrate', [hashRate, id])
  }
}
