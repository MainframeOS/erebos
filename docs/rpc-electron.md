---
title: RPC client for Electron
---

## Purpose

[`StreamRPC`](rpc-stream.md) factory using the [Electron transport](transport-electron.md).

## Installation

```sh
npm install @erebos/rpc-electron
```

## Usage

```javascript
import { createRPC } from '@erebos/rpc-electron'

const rpc = createRPC('optional-channel-name')

rpc.request('getUser', ['1234']).then(res => {
  console.log(res)
})
```

## API

### createRPC()

**Arguments**

1.  `channel?: ?string`, defaults to `rpc-message`

**Returns** [`StreamRPC`](rpc-stream.md)
