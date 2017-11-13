# erebos

JavaScript client for [Swarm](https://github.com/ethersphere/go-ethereum) and
[PSS](https://github.com/ethersphere/go-ethereum/blob/pss/swarm/pss/README.md#postal-services-over-swarm).

## Disclaimer

This library is a work-in-progress client for Swarm and PSS, themselves still at
a proof-of-concept stage. It is intended for demonstration purposes only.  
APIs are likely to be changed and even removed between releases without prior notice.

## Installation

```sh
yarn add erebos
```

## Example

Note: this is simplified code, it will not run as-is. See the
[example file](example.js) for a running example using a recent version of Node
(8+).

```js
import {
  base64ToArray,
  base64ToHex,
  createPSSWebSocket,
  decodeMessage,
  encodeMessage,
} from 'erebos'

// Open WebSocket connections to the PSS nodes
const [alice, bob] = await Promise.all([
  createPSSWebSocket('ws://localhost:8501'),
  createPSSWebSocket('ws://localhost:8502'),
])
// Retrieve Alice's public key and create the topic
const [key, topic] = await Promise.all([
  alice.getPublicKey(),
  alice.stringToTopic('PSS rocks'),
])
// Make Alice subscribe to the created topic and Bob add her public key
const [subscription] = await Promise.all([
  alice.subscribeTopic(topic),
  bob.setPeerPublicKey(base64ToArray(key), topic),
])
// Actually subscribe to the messages stream
alice.createSubscription(subscription).subscribe(payload => {
  const msg = decodeMessage(payload.Msg)
  console.log(`received message from ${payload.Key}: ${msg}`)
})
// Send message to Alice
bob.sendAsym(base64ToHex(key), topic, encodeMessage('hello world'))
```

## Types

- `arrayBuffer = Array<number>`: JS representation of `bytes` from PSS
- `base64 = string`: base64-encoded string
- `hex = string`: hexadecimal-encoded string prefixed with `0x`
- `topic = [number, number, number, number]`: a PSS topic (4 bytes)

## API

### BZZ(url: string)

Creates a BZZ instance using the server provided as `url`.

#### .uploadRaw(data: string | Buffer, headers?: Object = {}): Promise<string>

Uploads the provided `data` to the `bzzr:` endpoint and returns the created hash.  
The `content-length` header will be added to the `headers` Object based on the `data`.

#### .downloadRaw(hash: string): Promise<Response>

Downloads the file matching the provided `hash` using the `bzzr:` endpoint.

#### .downloadRawBlob(hash: string): Promise<Blob>

**Browser only - not available when using Node**  
Downloads the file matching the provided `hash` as a [`Blob`](https://developer.mozilla.org/en-US/docs/Web/API/Blob).

#### .downloadRawBuffer(hash: string): Promise<Buffer>

**Node only - not available in browser**  
Downloads the file matching the provided `hash` as a [`Buffer`](https://nodejs.org/dist/latest-v9.x/docs/api/buffer.html#buffer_buffer).

#### .downloadRawText(hash: string): Promise<string>

Downloads the file matching the provided `hash` as a string.

### createPSSWebSocket(url: string): PSS

Shortcut for creating a PSS instance using a WebSocket transport connecting to
the provided URL.

### PSS(rpc: RPC)

Creates a PSS instance with the provided `RPC` instance.

#### .getBaseAddr(): Promise<base64>

Calls [`pss_baseAddr`](https://github.com/ethersphere/go-ethereum/blob/pss/swarm/pss/README.md#pss_baseaddr).

#### .getPublicKey(): Promise<base64>

Calls [`pss_getPublicKey`](https://github.com/ethersphere/go-ethereum/blob/pss/swarm/pss/README.md#pss_getPublicKey).

#### .sendAsym(key: hex, topic: topic, message: byteArray): Promise<null>

Calls [`pss_sendAsym`](https://github.com/ethersphere/go-ethereum/blob/pss/swarm/pss/README.md#pss_sendAsym) with the provided arguments:

- `key: hex`: public key of the peer
- `topic: topic`: destination topic
- `message: byteArray`

#### .sendSym(keyID: string, topic: topic, message: byteArray): Promise<null>

Calls [`pss_sendSym`](https://github.com/ethersphere/go-ethereum/blob/pss/swarm/pss/README.md#pss_sendSym) with the provided arguments:

- `keyID: string`: symmetric key ID generated using `setSymmetricKey()`
- `topic: topic`: destination topic
- `message: byteArray`

#### .setPeerPublicKey(key: byteArray, topic: topic, address?: string = ''): Promise<null>

Calls [`pss_setPeerPublicKey`](https://github.com/ethersphere/go-ethereum/blob/pss/swarm/pss/README.md#pss_setPeerPublicKey) with the provided arguments:

- `key: byteArray`: public key of the peer
- `topic: topic`
- `address: byteArray`

#### .setSymmetricKey(key: byteArray, topic: topic, address?: string = '', useForDecryption: boolean = false): Promise<string>

Calls [`pss_setSymmetricKey`](https://github.com/ethersphere/go-ethereum/blob/pss/swarm/pss/README.md#pss_setSymmetricKey) with the provided arguments:

- `key: byteArray`: public key of the peer
- `topic: topic`
- `address: byteArray`

Returns the generated symmetric key ID.

#### .stringToTopic(str: string): Promise<topic>

Calls [`pss_stringToTopic`](https://github.com/ethersphere/go-ethereum/blob/pss/swarm/pss/README.md#pss_stringToTopic) with the provided string and returns the generated topic.

#### .subscribeTopic(topic: topic): Promise<hex>

Calls [`pss_subscribe`](https://github.com/ethersphere/go-ethereum/blob/pss/swarm/pss/README.md#pss_subscribe) with the provided topic and returns the subscription handle.

#### .createSubscription(subscription: hex): Observable<Object>

Creates a [RxJS Observable](http://reactivex.io/rxjs/class/es6/Observable.js~Observable.html) that will emit events matching the provided subscription handle as created by calling `subscribeTopic()` once subscribed to.

As documented in [PSS API](https://github.com/ethersphere/go-ethereum/blob/pss/swarm/pss/README.md#pss_subscribe), the received events will be objects with the following shape:

```js
{
  Msg: base64,
  Asymmetric: boolean,
  Key: string,
}
```

#### .createTopicSubscription(topic: topic): Promise<Observable<Object>>

Shortcut for calling `subscribeTopic()` followed by `createSubscription()`.

### RPC(transport: Subject<Object>)

Creates a RPC instance over the provided [RxJS Subject](http://reactivex.io/rxjs/class/es6/Subject.js~Subject.html) and starts subscribing to it.

#### .connect()

Subscribes to the transport.

#### .observe(method: string, params?: Array<any>): Observable<any>

Creates a [RxJS Observable](http://reactivex.io/rxjs/class/es6/Observable.js~Observable.html) that will call the `method` with the provided `params` once subscribed to.

#### .promise(method: string, params?: Array<any>): Promise<any>

Calls the `method` with the provided `params` and provides the resulting Promise.

#### .subscribe(destinationOrNext: Observer | (any) => void, error?: (any) => void, complete?: () => void): () => void

Creates a [RxJS Subscriber](http://reactivex.io/rxjs/class/es6/Subscriber.js~Subscriber.html) for incoming events over the transport with the provided arguments and returns the unsubscribe function.

### Utils

The following functions are exposed as part of the public API, they are useful to make conversions between the values received and the parameters required by the PSS API.

### encodeHex(input: string | byteArray, from: string = 'utf8'): hex

Creates a buffer calling [`Buffer.from()`](https://nodejs.org/dist/latest-v9.x/docs/api/buffer.html#buffer_buffer_from_buffer_alloc_and_buffer_allocunsafe) and converts it to a hexadecimal string prefixed by `0x`.

### decodeHex(input: string, to: string = 'utf8'): string

Creates a buffer calling [`Buffer.from()`](https://nodejs.org/dist/latest-v9.x/docs/api/buffer.html#buffer_buffer_from_buffer_alloc_and_buffer_allocunsafe) after removing the `0x` prefix from the input and converts it to the destination encoding.

### base64ToArray(str: base64): byteArray

Converts a base64-encoded string to a byteArray.

### base64ToHex(str: base64): hex

Converts a base64-encoded string to a hexadecimal string prefixed by `0x`.

### hexToBase64(hex: hex): base64

Converts a hexadecimal string prefixed by `0x` to a base64-encoded string.

### base64Array(str: base64): byteArray

Converts a base64-encoded string to a byteArray.

### encodeMessage(msg: string): byteArray

Converts a message (string) to a byteArray.

### encodeMessage(msg: base64): string

Decodes a message (base64-encoded string received from a subscription) to an utf8-encoded string.

## License

MIT.  
See [LICENSE](LICENSE) file.
