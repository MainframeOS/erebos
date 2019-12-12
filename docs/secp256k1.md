---
title: SECP256k1 signing
---

## Purpose

This package provides a basic signing functionality for Swarm feeds.

### ⚠️ Security warning

Managing key pairs on behalf of users is the responsibility of your app.
This library **may not be suited for your needs**, depending on your security constraints.
It is provided as a convenience but **has not been audited**, use at your own risk.

## Installation

```sh
npm install @erebos/secp256k1
```

## Usage

```javascript
import { createKeyPair, sign } from '@erebos/secp256k1'

const data = [1, 2, 3]
const keyPair = createKeyPair()
const signature = sign(data, keyPair)
```

## Interfaces and types

### BNInput

Input type used by the [`elliptic` library](https://github.com/indutny/elliptic).

### KeyPair

Key pair object as used by the [`elliptic` library](https://github.com/indutny/elliptic).

## API

### createKeyPair()

Creates a `KeyPair` by using the provided `privateKey` or a new random one.

**Arguments**

1.  `privateKey?: string`

**Returns** `KeyPair`

### createPublic()

Creates a `KeyPair` from a hex-encoded public key string.

**Arguments**

1.  `publicKey: string`

**Returns** `KeyPair`

### sign()

**Arguments**

1.  `input: BNInput`
1.  `privateKey: KeyPair | Buffer`

**Returns** `Array<number>` the signature bytes containing the `r` value in the first 32 bytes, the `s` value in the following 32, and the recovery param in the last byte

### verify()

**Arguments**

1.  `input: BNInput`
1.  `signature: Array<number> | elliptic.ec.SignatureOptions`: a bytes Array as returned by the [`sign()` function](#sign) or an object implementing the `elliptic.ec.SignatureOptions` interface.
1.  `pubKey: string | KeyPair`: the hex-encoded public key string or [`KeyPair` object](#keypair) created by calling [`createKeyPair()`](#createkeypair) or [`createPublic()`](#createpublic)

**Returns** `boolean`
