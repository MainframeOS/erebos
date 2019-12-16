---
title: Keccak256 hashing
---

## Purpose

This package provides Keccak256 hashing functions, as used by Ethereum and Swarm.

## Installation

```sh
npm install @erebos/keccak256
```

## Usage

```javascript
import { hash, pubKeyToAddress } from '@erebos/keccak256'

const hashed = hash(Buffer.from('hello'))

const pubKey = Buffer.from('...')
const address = pubKeyToAddress(pubKey)
```

## Interfaces and types

### hexValue

Hexadecimal-encoded string prefixed with `0x`. This type is exported by the [`@erebos/hex` package](hex.md).

## API

### hash()

**Arguments**

1.  `input: Array<number> | Buffer`

**Returns** `Array<number>`

### pubKeyToAddress()

Returns the Ethereum address from the provided `key`.

**Arguments**

1.  `key: hexValue | Array<number> | Buffer`

**Returns** `hexValue`
