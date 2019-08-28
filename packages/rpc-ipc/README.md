# rpc-ipc

[`rpc-stream`](../rpc-stream) factory using [`transport-ipc`](../transport-ipc).

## Installation

```sh
yarn add @erebos/rpc-ipc
```

## Usage

```js
import ipcRPC from '@erebos/rpc-ipc'

const rpc = ipcRPC('/path/to/socket')

rpc.request('getUser', ['1234']).then(console.log)
```

## API

### ipcRPC()

**Arguments**

1.  `path: string`

**Returns** [`StreamRPC`](../rpc-stream)

## License

MIT
