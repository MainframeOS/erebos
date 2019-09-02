---
title: RPC client over WebSocket
---

## Purpose

[`StreamRPC`](rpc-stream.md) factory using the [WebSocket transport](transport-ws.md).

## Installation

### For browser

```sh
npm install @erebos/rpc-ws-browser
```

### For Node

```sh
npm install @erebos/rpc-ws-node
```

## Usage

```javascript
import { createRPC } from '@erebos/rpc-ws-browser'

const rpc = createRPC('ws://localhost')

rpc.request('getUser', ['1234']).then(res => {
  console.log(res)
})
```

## API

### createRPC()

**Arguments**

1.  `url: string`

**Returns** [`StreamRPC`](rpc-stream.md)
