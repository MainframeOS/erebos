# rpc-http-browser

[`rpc-request`](../rpc-request) factory using [`transport-http-browser`](../transport-http-browser).

## Installation

```sh
yarn add @erebos/rpc-http-browser
```

## Usage

```js
import httpRPC from '@erebos/rpc-http-browser'

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
