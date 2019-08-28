# rpc-browser

[`rpc-request`](../rpc-request) or [`rpc-stream`](../rpc-stream) factory with automatic transport selection.

## Installation

```sh
yarn add @erebos/rpc-browser
```

## Usage

```js
import browserRPC from '@erebos/rpc-browser'

const rpcOverHTTP = browserRPC('http://localhost') // RequestRPC using HTTP transport
const rpcOverWS = browserRPC('ws://localhost') // StreamRPC using WebSocket transport
```

## API

### browserRPC()

**Arguments**

1.  `endpoint: string`: HTTP or WebSocket URL to connect to.

**Returns** [`RequestRPC`](../rpc-request) (with HTTP endpoint) or [`StreamRPC`](../rpc-stream) (with WebSocket endpoint).

## License

MIT
