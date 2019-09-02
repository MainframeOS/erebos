---
title: RPC handler
---

## Purpose

A JSON-RPC messages handler, supporting a stateful context and inputs validation.

## Installation

```sh
npm install @erebos/rpc-handler
```

## Usage

```javascript
import { createHandler } from '@erebos/rpc-handler'

const handle = createHandler({
  methods: {
    hello: {
      params: {
        name: 'string'
      },
      handler(ctx, params) => `hello ${params.name}`,
    },
    ping: () => 'pong',
  },
})

const context = {}

const incomingMessage = {
  jsonrpc: '2.0',
  id: 'test',
  method: 'hello',
  params: {
    name: 'bob',
  },
}

const outgoingMessage = await handle(context, incomingMessage)
// outgoingMessage = {jsonrpc: '2.0', id: 'test', result: 'hello bob'}
```

## Types

### RPCRequest

Imported from [`@erebos/rpc-base`](rpc-base.md)

### RPCResponse

Imported from [`@erebos/rpc-base`](rpc-base.md)

### ErrorHandler

```typescript
type ErrorHandler = <C = any, P = any>(
  ctx: C,
  msg: RPCRequest<P>,
  error: Error,
) => void
```

### MethodHandler

```typescript
type MethodHandler = <C = any, P = any, R = any>(
  ctx: C,
  params: P,
) => R | Promise<R>
```

### NotificationHandler

```typescript
type NotificationHandler = <C = any, P = any>(
  ctx: C,
  msg: RPCRequest<P>,
) => void
```

### MethodWithParams

```typescript
interface MethodWithParams {
  params?: Record<string, any> | undefined
  handler: MethodHandler
}
```

### Methods

```typescript
type Methods = Record<string, MethodHandler | MethodWithParams>
```

### HandlerParams

```typescript
interface HandlerParams {
  methods: Methods
  onHandlerError?: ErrorHandler | undefined
  onInvalidMessage?: NotificationHandler | undefined
  onNotification?: NotificationHandler | undefined
  validatorOptions?: any | undefined
}
```

### HandlerFunc

```typescript
type HandlerFunc = <C = any, P = any, R = any, E = any>(
  ctx: C,
  req: RPCRequest<P>,
) => Promise<RPCResponse<R, E>>
```

## API

### createHandler()

**Arguments**

1.  `params: HandlerParams`

**Returns** `HandlerFunc`

### parseJSON()

Tries to parse a JSON string, or throws a [`RPCError`](rpc-error.md) with code `-32700` (parse error)

**Arguments**

1.  `input: string`

**Returns** `T = any`
