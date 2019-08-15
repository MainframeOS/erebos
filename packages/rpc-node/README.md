# rpc-node

[`rpc-request`](../rpc-request) or [`rpc-stream`](../rpc-stream) factory with automatic transport selection.

## Installation

```sh
yarn add @erebos/rpc-node
```

## Usage

```js
import nodeRPC from '@erebos/rpc-node'

const rpcOverHTTP = nodeRPC('http://localhost') // RequestRPC using HTTP transport
const rpcOverWS = nodeRPC('ws://localhost') // StreamRPC using WebSocket transport
const rpcOverIPC = nodeRPC('/path/to/socket') // StreamRPC using ICP transport
```

## API

### nodeRPC()

**Arguments**

1.  `endpoint: string`: socket path, HTTP or WebSocket URL to connect to.

**Returns** [`RequestRPC`](../rpc-request) (with HTTP endpoint) or [`StreamRPC`](../rpc-stream) (with IPC or WebSocket endpoint).

## License

MIT
