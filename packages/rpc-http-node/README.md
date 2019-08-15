# rpc-http-node

[`rpc-request`](../rpc-request) factory using [`transport-http-node`](../transport-http-node).

## Installation

```sh
yarn add @erebos/rpc-http-node
```

## Usage

```js
import httpRPC from '@erebos/rpc-http-node'

const rpc = httpRPC('http://localhost')

rpc.request('getUser', ['1234']).then(console.log)
```

## API

### httpRPC()

**Arguments**

1.  `url: string`

**Returns** [`RequestRPC`](../rpc-request)

## License

MIT
