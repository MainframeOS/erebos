---
title: RPC client for Node
---

## Purpose

RPC client factory, returning a [`RequestRPC`](rpc-request.md) instance using the [HTTP transport](transport-http.md) if the provided `endpoint` is a HTTP URL, or a [`StreamRPC`](rpc-stream.md) instance using the [WebSocket transport](transport-ws.md) if the provided `endpoint` is a WebSocket URL or the [IPC transport](transport-ipc.md) if the provided `endpoint` is a socket path.

## Installation

```sh
npm install @erebos/rpc-node
```

## Usage

```javascript
import { createRPC } from '@erebos/rpc-node'

const rpcOverHTTP = createRPC('http://localhost') // RequestRPC using HTTP transport
const rpcOverWS = createRPC('ws://localhost') // StreamRPC using WebSocket transport
const rpcOverIPC = createRPC('/path/to/socket') // StreamRPC using ICP transport
```

## API

### createRPC()

**Arguments**

1.  `endpoint: string`: socket path, HTTP or WebSocket URL to connect to.

**Returns** [`RequestRPC`](rpc-request.md) (with HTTP endpoint) or [`StreamRPC`](rpc-stream.md) (with IPC path or WebSocket endpoint).
