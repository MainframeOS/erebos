---
title: StreamRPC client (stateful)
---

## Purpose

Class extending [`BaseRPC`](rpc-base.md) to handle stateless JSON-RPC 2.0 calls.

See the [`IPC transport`](transport-ipc.md) and [`WebSocket transports`](transport-ws.md) documentation for possible transports and the [`RequestRPC` class](rpc-request.md) documentation to handle stateless JSON-RPC 2.0 calls.

## Installation

```sh
npm install @erebos/rpc-stream
```

## Usage

```javascript
import { StreamRPC } from '@erebos/rpc-stream'
import { createTransport } from '@erebos/transport-ipc'

class MyAPI extends StreamRPC {
  constructor(path: string) {
    super(createTransport(path))
  }

  getUser(id: string): Promise<{ name: string }> {
    return this.request('getUser', [id])
  }
}

const api = new MyAPI('/path/to/socket')
api.getUser('1234')
```

## StreamRPC class

See the [`BaseRPC` documentation](rpc-base.md) for inherited methods and properties.

### new StreamRPC()

**Arguments**

1.  `subject: Subject`: a [RxJS `Subject`](https://rxjs.dev/api/index/class/Subject) handling communication with the server.

### .request()

**Arguments**

1.  `method: string`
1.  `params: T = any`

**Returns** `Promise<R = any>`
