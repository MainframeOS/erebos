# transport-ws-browser

WebSocket transport for browser as a [RxJS `Subject`](http://reactivex.io/rxjs/class/es6/Subject.js~Subject.html).

## Installation

```sh
yarn add @erebos/transport-ws-browser
```

## Usage

```js
import wsTransport from '@erebos/transport-ws-browser'

const transport = wsTransport('ws://localhost')

transport.subcribe(console.log)
transport.next({ hello: 'transport' })
```

## API

### wsTransport()

**Arguments**

1.  `url: string`

**Returns** `Rx.Subject<Object>`

## License

MIT
