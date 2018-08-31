# Eth API

```js
import Eth from '@erebos/api-eth'
```

## Types

```js
type blockIndex = hex | 'latest' | 'earliest' | 'pending'

type EthBlock = {
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

type EthTransaction = {
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

type EthTransactionReceiptPreByzantium = {
  ...EthTransactionReceiptCommon,
  root: hex,
}

type EthTransactionReceiptPostByzantium = {
  ...EthTransactionReceiptCommon,
  status: hex,
}

type EthTransactionReceipt =
  | EthTransactionReceiptPreByzantium
  | EthTransactionReceiptPostByzantium

type EthFilterOptions = {
  fromBlock?: blockIndex,
  toBlock?: blockIndex,
  address?: hex | Array<hex>,
  topics?: Array<hex>,
}

type EthLog = {
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

type EthFilterResults = Array<hex> | Array<EthLog>
```

## Class

### new Eth()

Creates an Eth instance using the provided `rpc` handler.

**Arguments**

1.  `rpc: RPC`

### .protocolVersion()

**Returns** `Promise<string>`

### .syncing()

**Returns** `Promise<Object | false>`

### .coinbase()

**Returns** `Promise<hex>`

### .mining()

**Returns** `Promise<boolean>`

### .hashrate()

**Returns** `Promise<hex>`

### .gasPrice()

**Returns** `Promise<hex>`

### .accounts()

**Returns** `Promise<Array<hex>>`

### .blockNumber()

**Returns** `Promise<hex>`

### .getBalance()

**Arguments**

1.  `address: hex`
1.  `block: blockIndex`

**Returns** `Promise<hex>`

### .getStorageAt()

**Arguments**

1.  `address: hex`
1.  `position: hex`
1.  `block: blockIndex`

**Returns** `Promise<hex>`

### .getTransactionCount()

**Arguments**

1.  `address: hex`
1.  `block: blockIndex`

**Returns** `Promise<hex>`

### .getBlockTransactionCountByHash()

**Arguments**

1.  `hash: hex`

**Returns** `Promise<hex>`

### .getBlockTransactionCountByNumber()

**Arguments**

1.  `block: blockIndex`

**Returns** `Promise<hex>`

### .getUncleCountByBlockHash()

**Arguments**

1.  `hash: hex`

**Returns** `Promise<hex>`

### .getUncleCountByBlockNumber()

**Arguments**

1.  `block: blockIndex`

**Returns** `Promise<hex>`

### .getCode()

**Arguments**

1.  `address: hex`
1.  `block: blockIndex`

**Returns** `Promise<hex>`

### .sign()

**Arguments**

1.  `address: hex`
1.  `message: hex`

**Returns** `Promise<hex>`

### .sendTransaction()

**Arguments**

1.  `transaction: { from: hex, to?: hex, gas?: hex, gasPrice?: hex, value?: hex, data: hex, nonce?: hex, }`

**Returns** `Promise<hex>`

### .sendRawTransaction()

**Arguments**

1.  `data: hex`

**Returns** `Promise<hex>`

### .call()

**Arguments**

1.  `transaction: { from?: hex, to: hex, gas?: hex, gasPrice?: hex, value?: hex, data?: hex, }`
1.  `block: blockIndex`

**Returns** `Promise<hex>`

### .estimateGas()

**Arguments**

1.  `transaction: { from?: hex, to?: hex, gas?: hex, gasPrice?: hex, value?: hex, data?: hex, }`

**Returns** `Promise<hex>`

### .getBlockByHash()

**Arguments**

1.  `hash: hex`
1.  `full: boolean`

**Returns** `Promise<?EthBlock>`

### .getBlockByNumber()

**Arguments**

1.  `block: blockIndex`
1.  `full: boolean`

**Returns** `Promise<?EthBlock>`

### .getTransactionByHash()

**Arguments**

1.  `hash: hex`

**Returns** `Promise<?EthTransaction>`

### .getTransactionByBlockHashAndIndex()

**Arguments**

1.  `hash: hex`
1.  `index: hex`

**Returns** `Promise<?EthTransaction>`

### .getTransactionByBlockNumberAndIndex()

**Arguments**

1.  `block: blockIndex`
1.  `index: hex`

**Returns** `Promise<?EthTransaction>`

### .getTransactionReceipt()

**Arguments**

1.  `hash: hex`

**Returns** `Promise<?EthTransactionReceipt>`

### .getUncleByBlockHashAndIndex()

**Arguments**

1.  `hash: hex`
1.  `index: hex`

**Returns** `Promise<?EthBlock>`

### .getUncleByBlockNumberAndIndex()

**Arguments**

1.  `block: blockIndex`
1.  `index: hex`

**Returns** `Promise<?EthBlock>`

### .getCompilers()

**Returns** `Promise<Array<string>>`

### .compileSolidity()

**Arguments**

1.  `code: string`

**Returns** `Promise<hex>`

### .compileLLL()

**Arguments**

1.  `code: string`

**Returns** `Promise<hex>`

### .compileSerpent()

**Arguments**

1.  `code: string`

**Returns** `Promise<hex>`

### .newFilter()

**Arguments**

1.  `options: EthFilterOptions`

**Returns** `Promise<hex>`

### .newBlockFilter()

**Returns** `Promise<hex>`

### .newPendingTransactionFilter()

**Returns** `Promise<hex>`

### .uninstallFilter()

**Arguments**

1.  `id: hex`

**Returns** `Promise<boolean>`

### .getFilterChanges()

**Arguments**

1.  `id: hex`

**Returns** `Promise<EthFilterResults>`

### .getFilterLogs()

**Arguments**

1.  `id: hex`

**Returns** `Promise<EthFilterResults>`

### .getLogs()

**Arguments**

1.  `options: EthFilterOptions`

**Returns** `Promise<Array<EthLog>>`

### .getWork()

**Returns** `Promise<[hex, hex, hex]>`

### .submitWork()

**Arguments**

1.  `nonce: hex`
1.  `hash: hex`
1.  `digest: hex`

**Returns** `Promise<boolean>`

### .submitHashrate()

**Arguments**

1.  `hashRate: hex`
1.  `id: hex`

**Returns** `Promise<boolean>`
