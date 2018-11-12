// @flow

import type { hexValue } from '@erebos/hex'
import type { default as RPCType } from '@mainframe/rpc-base'

export type RPC = RPCType

export type blockIndex = hexValue | 'latest' | 'earliest' | 'pending'

export type EthBlock = {
  number: ?hexValue,
  hash: ?hexValue,
  parentHash: hexValue,
  nonce: ?hexValue,
  sha3Uncles: hexValue,
  logsBloom: ?hexValue,
  transactionsRoot: hexValue,
  stateRoot: hexValue,
  receiptsRoot: hexValue,
  miner: hexValue,
  difficulty: hexValue,
  totalDifficulty: hexValue,
  extraData: hexValue,
  size: hexValue,
  gasLimit: hexValue,
  gasUsed: hexValue,
  timestamp: hexValue,
  transactions: Array<hexValue> | Array<Object>,
  uncles: Array<hexValue>,
}

export type EthTransaction = {
  hash: hexValue,
  nonce: hexValue,
  blockHash: ?hexValue,
  blockNumber: ?hexValue,
  transactionIndex: ?hexValue,
  from: hexValue,
  to: ?hexValue,
  value: hexValue,
  gasPrice: hexValue,
  gas: hexValue,
  input: hexValue,
}

type EthTransactionReceiptCommon = {
  transactionHash: hexValue,
  transactionIndex: hexValue,
  blockHash: hexValue,
  blockNumber: hexValue,
  cumulativeGasUsed: hexValue,
  gasUsed: hexValue,
  contractAddress: ?hexValue,
  logs: Array<Object>,
  logsBloom: hexValue,
}

export type EthTransactionReceiptPreByzantium = {
  ...EthTransactionReceiptCommon,
  root: hexValue,
}

export type EthTransactionReceiptPostByzantium = {
  ...EthTransactionReceiptCommon,
  status: hexValue,
}

export type EthTransactionReceipt =
  | EthTransactionReceiptPreByzantium
  | EthTransactionReceiptPostByzantium

export type EthFilterOptions = {
  fromBlock?: blockIndex,
  toBlock?: blockIndex,
  address?: hexValue | Array<hexValue>,
  topics?: Array<hexValue>,
}

export type EthLog = {
  removed?: hexValue,
  logIndex: hexValue,
  transactionIndex: ?hexValue,
  transactionHash: ?hexValue,
  blockHash: ?hexValue,
  blockNumber: ?hexValue,
  address: hexValue,
  data: hexValue,
  topics: Array<hexValue>,
}

export type EthFilterResults = Array<hexValue> | Array<EthLog>
