// @flow

import type { default as RPCType } from '@mainframe/rpc-base'
import type { hex as hexType } from '@mainframe/utils-hex'

export type RPC = RPCType
export type hex = hexType

export type blockIndex = hex | 'latest' | 'earliest' | 'pending'

export type EthBlock = {
  number: ?hex,
  hash: ?hex,
  parentHash: hex,
  nonce: ?hex,
  sha3Uncles: hex,
  logsBloom: ?hex,
  transactionsRoot: hex,
  stateRoot: hex,
  receiptsRoot: hex,
  miner: hex,
  difficulty: hex,
  totalDifficulty: hex,
  extraData: hex,
  size: hex,
  gasLimit: hex,
  gasUsed: hex,
  timestamp: hex,
  transactions: Array<hex> | Array<Object>,
  uncles: Array<hex>,
}

export type EthTransaction = {
  hash: hex,
  nonce: hex,
  blockHash: ?hex,
  blockNumber: ?hex,
  transactionIndex: ?hex,
  from: hex,
  to: ?hex,
  value: hex,
  gasPrice: hex,
  gas: hex,
  input: hex,
}

type EthTransactionReceiptCommon = {
  transactionHash: hex,
  transactionIndex: hex,
  blockHash: hex,
  blockNumber: hex,
  cumulativeGasUsed: hex,
  gasUsed: hex,
  contractAddress: ?hex,
  logs: Array<Object>,
  logsBloom: hex,
}

export type EthTransactionReceiptPreByzantium = {
  ...EthTransactionReceiptCommon,
  root: hex,
}

export type EthTransactionReceiptPostByzantium = {
  ...EthTransactionReceiptCommon,
  status: hex,
}

export type EthTransactionReceipt =
  | EthTransactionReceiptPreByzantium
  | EthTransactionReceiptPostByzantium

export type EthFilterOptions = {
  fromBlock?: blockIndex,
  toBlock?: blockIndex,
  address?: hex | Array<hex>,
  topics?: Array<hex>,
}

export type EthLog = {
  removed?: hex,
  logIndex: hex,
  transactionIndex: ?hex,
  transactionHash: ?hex,
  blockHash: ?hex,
  blockNumber: ?hex,
  address: hex,
  data: hex,
  topics: Array<hex>,
}

export type EthFilterResults = Array<hex> | Array<EthLog>
