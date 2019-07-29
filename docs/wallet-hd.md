---
title: Hierarchical Deterministic wallet
---

## Installation

```sh
npm install @erebos/wallet-hd
```

## Usage

```javascript
import { HDWallet } from '@erebos/wallet-hd'

const wallet = HDWallet.createRandom()
const sameWallet = new HDWallet(wallet.mnemonic)
```

## Flow types

### Arrayish

[Exported by the ethers.js library](https://docs.ethers.io/ethers.js/html/api-utils.html#arrayish).

### TransactionParams

```javascript
type TransactionParams = {
  from: string,
  to?: string,
  value?: string,
  data?: string,
  gasLimit: string,
  gasPrice: string,
  chainId?: string,
}
```

### Wallet

[Wallet instance as exported by the ethers.js library](https://docs.ethers.io/ethers.js/html/api-wallet.html#wallet).

## Public API

### HDWallet class

**Arguments**

1.  `mnemonic: string`
1.  `activeIndexes?: Array<number> = [0]`

### HDWallet.createRandom()

Static function on the `HDWallet` class returning an instance with a randomly generated mnemonic.

**Returns** `HDWallet`

### .mnemonic

**Returns** `string`

### .wallets

**Returns** `Array<Wallet>`

### .accounts

**Returns** `Array<string>` the list of wallet addresses.

### .getAccountWallet()

**Arguments**

1.  `address: string`

**Returns** `Wallet` if found for the given `address`

### .addAccount()

**Arguments**

1.  `index: number`

**Returns** `Wallet`

### .discardAccount()

**Arguments**

1.  `index: number`

### .signTransaction()

**Arguments**

1.  `params: TransactionParams`

**Returns** `Promise<string>`

### .signMessage()

**Arguments**

1.  `address: string`
1.  `message: string | Arrayish`

**Returns** `Promise<string>`

### .signBytes()

**Arguments**

1.  `address: string`
1.  `bytes: Array<number>`

**Returns** `Array<number>`
