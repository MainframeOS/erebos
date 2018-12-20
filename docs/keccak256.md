---
title: Keccak256 hashing
---

## Purpose

TODO

## Usage

```javascript
import { hash, pubKeyToAddress } from '@erebos/keccak256'

// TODO
```

## Flow types

### hexValue

Hex-encoded string prefixed with `0x` as used in the [`@erebos/hex` package](hex.md).

## Public API

### hash()

**Arguments**

1.  `input: Array<number> | Buffer`

**Returns** `Array<number>`

### pubKeyToAddress()

Returns the Ethereum address from the provided `key`.

**Arguments**

1.  `key: Array<number> | Buffer`

**Returns** `hexValue`
