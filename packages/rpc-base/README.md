# rpc-base

Abstract class to handle JSON-RPC 2.0 calls, used by [`rpc-request`](../rpc-request) and [`rpc-stream`](../rpc-stream).

## Installation

```sh
yarn add @erebos/rpc-base
```

## Usage

```js
import BaseRPC from '@erebos/rpc-base'

class MyRPC extends BaseRPC {
  request(...params: any): Promise<any> {
    // ...
  }
}
```

## Types

### RPCID

```js
type RPCID = string | number | null
```

### RPCRequest

```js
interface RPCRequest<T = any> {
  jsonrpc: '2.0'
  method: string
  id?: RPCID
  params?: T
}
```

### RPCError

```js
interface RPCErrorObject<T = any> {
  code: number;
  message?: ?string;
  data?: T;
}
```

### RPCResponse

```js
interface RPCResponse<T = any, E = any> {
  jsonrpc: '2.0';
  id: RPCID;
  result?: T;
  error?: RPCErrorObject<E>;
}
```

## API

### new BaseRPC()

**Arguments**

1.  `canSubscribe: boolean = false`: whether subscription calls (using a stateful connection) are supported by the implementation or not.

### .canSubscribe

**Returns** `boolean`

### .createId()

**Returns** `string`: an unique ID for RPC calls.

### .request()

**⚠️ This is an abstract method, it must be implemented by extending classes**\

**Arguments**

1. `method: string`
1. `params?: P`

**Returns** `Promise<T = any>`

## License

MIT
