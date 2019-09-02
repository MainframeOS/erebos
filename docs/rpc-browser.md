---
title: RPC client for browsers
---

## Purpose

RPC client factory, returning a [`RequestRPC`](rpc-request.md) instance using the [HTTP transport](transport-http.md) if the provided `endpoint` is a HTTP URL, or a [`StreamRPC`](rpc-stream.md) instance using the [WebSocket transport](transport-ws.md) if the provided `endpoint` is a WebSocket URL.

## Installation

```sh
npm install @erebos/rpc-browser
```

## Usage

```javascript
import { createRPC } from '@erebos/rpc-browser'

const rpcOverHTTP = createRPC('http://localhost') // RequestRPC using HTTP transport
const rpcOverWS = createRPC('ws://localhost') // StreamRPC using WebSocket transport
```

## API

### createRPC()

**Arguments**

1.  `endpoint: string`: HTTP or WebSocket URL to connect to.

**Returns** [`RequestRPC`](rpc-request.md) (with HTTP endpoint) or [`StreamRPC`](rpc-stream.md) (with WebSocket endpoint).
