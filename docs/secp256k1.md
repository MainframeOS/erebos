---
title: SECP256k1 signing
---

## Purpose

TODO: usage for feeds + warn about security / storage of private keys

## Usage

```javascript
import { createKeyPair, sign } from '@erebos/secp256k1'

const data = [1, 2, 3]

const kp = createKeyPair()
const signature = sign(data, kp.getPrivate())
```

## Flow types

### KeyPair

Key pair object as used by the [`elliptic` library](https://github.com/indutny/elliptic).

## Public API

### createKeyPair()

Creates a `KeyPair` by using the provided `privateKey` or a new random one.

**Arguments**

1.  `privateKey?: string`
1.  `encoding?: hex`

**Returns** `KeyPair`

### sign()

**Arguments**

1.  `bytes: Array<number>`
1.  `privateKey: Object`: the private key returned by the `getPrivate()` method of the `KeyPair` instance.

**Returns** `Array<number>`
