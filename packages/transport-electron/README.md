# transport-electron

[Electron IPC](https://electronjs.org/docs/api/ipc-renderer) transport as a [RxJS `Subject`](http://reactivex.io/rxjs/class/es6/Subject.js~Subject.html).

## Installation

```sh
yarn add @erebos/transport-electron
```

## Usage

```js
import electronTransport from '@erebos/transport-electron'

const transport = electronTransport('optional-channel-name')

transport.subcribe(console.log)
transport.next({ hello: 'transport' })
```

## API

### electronTransport()

**Arguments**

1.  `channel?: ?string`, defaults to `rpc-message`

**Returns** `Rx.Subject<Object>`

## License

MIT
