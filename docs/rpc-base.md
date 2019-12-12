---
title: Base RPC class and types
---

## Purpose

Abstract class to handle JSON-RPC 2.0 calls, used by the [`RequestRPC`](rpc-request.md) and [`StreamRPC`](rpc-stream.md) classes.

## Installation

```sh
npm install @erebos/rpc-base
```

## Usage

```javascript
import { BaseRPC } from '@erebos/rpc-base'

class MyRPC extends BaseRPC {
  request(...params: any): Promise<any> {
    // ...
  }
}
```

## Interfaces and types

### RPCID

```typescript
type RPCID = string | number | null
```

### RPCRequest

```typescript
interface RPCRequest<T = any> {
  jsonrpc: '2.0'
  method: string
  id?: RPCID
  params?: T
}
```

### RPCErrorObject

```typescript
interface RPCErrorObject<T = any> {
  code: number;
  message?: ?string;
  data?: T;
}
```

### RPCResponse

```typescript
interface RPCResponse<T = any, E = any> {
  jsonrpc: '2.0'
  id: RPCID
  result?: T
  error?: RPCErrorObject<E>
}
```

## BaseRPC class

### new BaseRPC()

**Arguments**

1.  `canSubscribe: boolean = false`: whether subscription calls (using a stateful connection) are supported by the implementation or not.

### .canSubscribe

**Returns** `boolean`

### .createID()

**Returns** `string`: an unique ID for RPC calls.

### .request()

**⚠️ This is an abstract method, it must be implemented by extending classes**

**Arguments**

1. `method: string`
1. `params?: P = any`

**Returns** `Promise<T = any>`
