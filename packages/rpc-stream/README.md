# rpc-stream

Class extending [`rpc-base`](../rpc-base) to handle stateful JSON-RPC 2.0 calls.

See [`transport-ipc`](../transport-ipc), [`transport-ws-browser`](../transport-ws-browser) and [`transport-ws-node`](../transport-ws-node) for possible transports and [`rpc-request`](../rpc-request) to handle stateless JSON-RPC 2.0 calls.

## Installation

```sh
yarn add @erebos/rpc-stream
```

## Usage

```js
import StreamRPC from '@erebos/rpc-stream'
import ipcTransport from '@erebos/transport-ipc'

class MyAPI extends StreamRPC {
  constructor(path: string) {
    super(ipcTransport(path))
  }

  getUser(id: string): Promise<{ name: string }> {
    return this.request('getUser', [id])
  }
}

const api = new MyAPI('/path/to/socket')
api.getUser('1234')
```

## API

See [the `BaseRPC` API](../rpc-base/README.md#api) for inherited methods and properties.

### new StreamRPC()

**Arguments**

1.  `subject: Subject`: a [RxJS `Subject`](http://reactivex.io/rxjs/class/es6/Subject.js~Subject.html) handling communication with the server.

### .request()

**Arguments**

1.  `method: string`
1.  `params: T = any`

**Returns** `Promise<R = any>`

## License

MIT
