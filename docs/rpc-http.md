---
title: RPC client over HTTP
---

## Purpose

[`RequestRPC`](rpc-request.md) factory using the [HTTP transport](transport-http.md).

## Installation

### For browser

```sh
npm install @erebos/rpc-http-browser
```

### For Node

```sh
npm install @erebos/rpc-http-node
```

## Usage

```javascript
import { createRPC } from '@erebos/rpc-http-browser'

const rpc = createRPC('http://localhost')

rpc.request('getUser', ['1234']).then(res => {
  console.log(res)
})
```

## API

### createRPC()

**Arguments**

1.  `url: string`

**Returns** [`RequestRPC`](rpc-request.md)
