# rpc-ws-node

[`rpc-stream`](../rpc-stream) factory using [`transport-ws-node`](../transport-ws-node).

## Installation

```sh
yarn add @erebos/rpc-ws-node
```

## Usage

```js
import wsRPC from '@erebos/rpc-ws-node'

const rpc = wsRPC('ws://localhost')

rpc.request('getUser', ['1234']).then(console.log)
```

## API

### wsRPC()

**Arguments**

1.  `url: string`

**Returns** [`StreamRPC`](../rpc-stream)

## License

MIT
