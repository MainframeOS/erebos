---
title: RPC Errors
---

## Purpose

Error class and utilities for JSON-RPC errors.

## Installation

```sh
npm install @erebos/rpc-error
```

## Usage

```javascript
import {
  RPCError,
  createParseError,
  createMethodNotFound,
} from '@erebos/rpc-error'

const error1 = createParseError()
const error2 = createMethodNotFound('get_user')
const error3 = new RPCError(-32600) // Invalid request
const error4 = new RPCError(1000, 'Custom app error', { user: 'alice' })
```

## API

### new RPCError()

**Arguments**

1.  `code: number`
1.  `message?: string`: will be set based on the `code` when not provided
1.  `data?: T = any`: optional additional error data

### .toObject()

**Returns** [`RPCErrorObject`](rpc-base.md#rpcerrorobject)

### RPCError.fromObject()

Creates a RPCError instance from a [`RPCErrorObject`](rpc-base.md#rpcerrorobject).

**Arguments**

1.  `error: RPCErrorObject`

**Returns** `RPCError` instance

### isServerError()

**Arguments**

1.  `code: number`

**Returns** `boolean`

### getErrorMessage()

**Arguments**

1.  `code: number`

**Returns** `string`

### createParseError()

**Arguments**

1.  `data?: ?any`

**Returns** `RPCError` instance with code `-32700`

### createInvalidRequest()

**Arguments**

1.  `data?: ?any`

**Returns** `RPCError` instance with code `-32600`

### createMethodNotFound()

**Arguments**

1.  `data?: ?any`

**Returns** `RPCError` instance with code `-32601`

### createInvalidParams()

**Arguments**

1.  `data?: ?any`

**Returns** `RPCError` instance with code `-32602`

### createInternalError()

**Arguments**

1.  `data?: ?any`

**Returns** `RPCError` instance with code `-32603`
