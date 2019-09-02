---
title: RPC client over IPC
---

## Purpose

[`StreamRPC`](rpc-stream.md) factory using the [IPC transport](transport-ipc.md).

## Installation

```sh
npm install @erebos/rpc-ipc
```

## Usage

```javascript
import { createRPC } from '@erebos/rpc-ipc'

const rpc = createRPC('/path/to/socket')

rpc.request('getUser', ['1234']).then(res => {
  console.log(res)
})
```

## API

### createRPC()

**Arguments**

1.  `path: string`

**Returns** [`StreamRPC`](rpc-stream.md)
