# rpc-electron

[`rpc-stream`](../rpc-stream) factory using [`transport-electron`](../transport-electron).

## Installation

```sh
yarn add @erebos/rpc-electron
```

## Usage

```js
import electronRPC from '@erebos/rpc-electron'

const rpc = electronRPC('optional-channel-name')

rpc.request('getUser', ['1234']).then(console.log)
```

## API

### electronRPC()

**Arguments**

1.  `channel?: ?string`, defaults to `rpc-message`

**Returns** [`StreamRPC`](../rpc-stream)

## License

MIT
