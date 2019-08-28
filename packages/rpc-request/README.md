# rpc-request

Class extending [`rpc-base`](../rpc-base) to handle stateless JSON-RPC 2.0 calls.

See [`transport-create-http`](../transport-create-http), [`transport-http-browser`](../transport-http-browser) and [`transport-http-node`](../transport-http-node) for possible transports and [`rpc-stream`](../rpc-stream) to handle stateful JSON-RPC 2.0 calls.

## Installation

```sh
yarn add @erebos/rpc-request
```

## Usage

```js
import RequestRPC from '@erebos/rpc-request'
import httpTransport from '@erebos/transport-http-node'

class MyAPI extends RequestRPC {
  constructor(url: string) {
    super(httpTransport(url))
  }

  getUser(id: string): Promise<{ name: string }> {
    return this.request('getUser', [id])
  }
}

const api = new MyAPI('http://my-api-url')
api.getUser('1234')
```

## Types

```js
type FetchFunction = <D = any, R = any>(data: D) => Promise<R>
```

## API

See [the `BaseRPC` API](../rpc-base/README.md#api) for inherited methods and properties.

### new RequestRPC()

**Arguments**

1.  `fetch: FetchFunction`: function making the server call using the JSON-RPC request Object and returning the response.

### .request()

**Arguments**

1.  `method: string`
1.  `params: T = any`

**Returns** `Promise<R = any>`

## License

MIT
