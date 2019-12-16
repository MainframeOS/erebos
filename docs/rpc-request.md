---
title: RequestRPC client (stateless)
---

## Purpose

Class extending [`BaseRPC`](rpc-base.md) to handle stateless JSON-RPC 2.0 calls.

See [HTTP transports documentation](transport-http.md) for possible transports and the [`StreamRPC` class](rpc-stream.md) documentation to handle stateful JSON-RPC 2.0 calls.

## Installation

```sh
npm install @erebos/rpc-request
```

## Usage

```javascript
import { RequestRPC } from '@erebos/rpc-request'
import { createTransport } from '@erebos/transport-http-node'

class MyAPI extends RequestRPC {
  constructor(url: string) {
    super(createTransport(url))
  }

  getUser(id: string): Promise<{ name: string }> {
    return this.request('getUser', [id])
  }
}

const api = new MyAPI('http://my-api-url')
api.getUser('1234')
```

## Interfaces and types

```typescript
type FetchFunction = <D = any, R = any>(data: D) => Promise<R>
```

## RequestRPC class

See the [`BaseRPC` documentation](rpc-base.md) for inherited methods and properties.

### new RequestRPC()

**Arguments**

1.  `fetch: FetchFunction`: function making the server call using the JSON-RPC request Object and returning the response.

### .request()

**Arguments**

1.  `method: string`
1.  `params: T = any`

**Returns** `Promise<R = any>`
