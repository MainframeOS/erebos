# rpc-handler

JSON-RPC messages handler.

## Installation

```sh
yarn add @erebos/rpc-handler
```

## Usage

```js
import createHandler from '@erebos/rpc-handler'

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

Imported from `@erebos/rpc-base`

### RPCResponse

Imported from `@erebos/rpc-base`

### ErrorHandler

```js
type ErrorHandler = <C = any, P = any>(ctx: C, msg: RPCRequest<P>, error: Error) => void
```

### MethodHandler

```js
type MethodHandler = <C = any, P = any, R = any>(ctx: C, params: P) => R | Promise<R>
```

### NotificationHandler

```js
type NotificationHandler = <C = any, P = any>(ctx: C, msg: RPCRequest<P>) => void
```

### MethodWithParams

```js
interface MethodWithParams {
  params?: Record<string, any> | undefined
  handler: MethodHandler
}
```

### Methods

```js
type Methods = Record<string, MethodHandler | MethodWithParams>
```

### HandlerParams

```js
type HandlerParams = {
  methods: Methods,
  onHandlerError?: ErrorHandler | undefined,
  onInvalidMessage?: NotificationHandler | undefined,
  onNotification?: NotificationHandler | undefined,
  validatorOptions?: any | undefined,
}
```

### HandlerFunc

```js
type HandlerFunc = <C = any, P = any, R = any, E = any>(
  ctx: C,
  req: RPCRequest<P>,
) => Promise<RPCResponse<R, E>>
```

## API

### createHandler()

**Default export of the library**

**Arguments**

1.  `params: HandlerParams`

**Returns** `HandlerFunc`

### parseJSON()

Tries to parse a JSON string, or throws a RPCError with code `-32700` (parse error)

**Arguments**

1.  `input: string`

**Returns** `T = any`

## License

MIT
