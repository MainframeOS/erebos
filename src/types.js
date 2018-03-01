// @flow

import type { BzzAPI, EthAPI, NetAPI, PssAPI, ShhAPI, Web3API } from './api'
import type RPC from './rpc/BaseRPC'

export type hex = string // Prefixed with `0x`

export type blockIndex = hex | 'latest' | 'earliest' | 'pending'

export type ClientConfig = {
  bzz?: string | BzzAPI,
  eth?: string | EthAPI,
  http?: string,
  ipc?: string,
  net?: string | NetAPI,
  pss?: string | PssAPI,
  rpc?: RPC,
  shh?: string | ShhAPI,
  web3?: string | Web3API,
  ws?: string,
}

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

export type ShhInfo = {
  memory: number,
  messages: number,
  minPow: number,
  maxMessageSize: number,
}

export type ShhFilterCriteria = {
  symKeyID?: string,
  privateKeyID?: string,
  sig?: hex,
  minPow?: number,
  topics: Array<hex>,
  allowP2P?: boolean,
}

export type ShhPostMessage = {
  symKeyID?: string,
  pubKey?: hex,
  sig?: string,
  ttl?: number,
  topic: hex,
  payload: hex,
  padding?: hex,
  powTime?: number,
  powTarget?: number,
  targetPeer?: string,
}

export type ShhReceivedMessage = {
  sig?: hex,
  ttl: number,
  timestamp: number,
  topic: hex,
  payload: hex,
  padding: hex,
  pow: number,
  hash: number,
  recipientPublicKey?: hex,
}
