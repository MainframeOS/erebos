# Transports

Erebos supports 4 transports to interact with a server:

* HTTP using `httpTransport`
* IPC using `ipcTransport`
* Web3 using `web3Transport`
* WebSocket using `webSocketTransport`

### httpTransport()

Creates a HTTP transport using the [Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API) to make calls to the provided endpoint `url`.

**Arguments**

1.  `url: string`

**Returns** `(data: Object) => Promise<Object>`

### ipcTransport()

**⚠️ Node only - not available in browser**\
Creates an ICP transport using a [RxJS Subject](http://reactivex.io/rxjs/class/es6/Subject.js~Subject.html) for the socket at the provided `path`.

**Arguments**

1.  `path: string`

**Returns** `Subject<Object>`

### web3Transport()

Uses an existing Web3 provider, either injected or defaulting to `web3.currentProvider`.

**Arguments**

1.  `provider?: Object`

**Returns** `(data: Object) => Promise<Object>`

### webSocketTransport()

Creates an WebSocket transport using a [RxJS Subject](http://reactivex.io/rxjs/class/es6/Subject.js~Subject.html) connecting to the provided endpoint `url`.

**Arguments**

1.  `url: string`

**Returns** `Subject<Object>`
