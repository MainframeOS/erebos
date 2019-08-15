# transport-ipc

[IPC](https://nodejs.org/dist/latest-v9.x/docs/api/net.html#net_ipc_support) transport for node as a [RxJS `Subject`](http://reactivex.io/rxjs/class/es6/Subject.js~Subject.html).

## Installation

```sh
yarn add @erebos/transport-ipc
```

## Usage

```js
import ipcTransport from '@erebos/transport-ipc'

const transport = ipcTransport('/path/to/socket')

transport.subcribe(console.log)
transport.next({ hello: 'transport' })
```

## API

### ipcTransport()

**Arguments**

1.  `path: string`

**Returns** `Rx.Subject<Object>`

## License

MIT
