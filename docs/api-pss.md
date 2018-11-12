---
title: Postal Services over Swarm (Pss) API
sidebar_label: Pss API
---

## Standalone usage

```javascript
import PssAPI from '@erebos/api-pss'
import webSocketRPC from '@mainframe/rpc-ws-browser'
// or
import webSocketRPC from '@mainframe/rpc-ws-node'
// or any other StreamRPC factory

const rpc = webSocketRPC('ws://localhost:8546')
const pss = new PssAPI(rpc)
```

## Flow types

### hex

The `hex` type represents a hex-encoded string, as used by Swarm and this PSS API.\
The [`@mainframe/utils-hex` library](https://github.com/MainframeHQ/js-tools/tree/master/packages/utils-hex) provided utilities to interact with this type.

### PssEvent

```javascript
type PssEvent = {
  Asym: boolean,
  Key: hex,
  Msg: hex,
}
```

## Public API

### Pss class (default export)

Creates a Pss instance with the provided `StreamRPC` instance.

**Arguments**

1.  `rpc: StreamRPC`

### .baseAddr()

Calls
[`pss_baseAddr`](https://github.com/ethersphere/go-ethereum/tree/swarm-network-rewrite-syncer/swarm/pss/README.md#pss_baseaddr).

**Returns** `Promise<hex>`

### .getPublicKey()

Calls
[`pss_getPublicKey`](https://github.com/ethersphere/go-ethereum/tree/swarm-network-rewrite-syncer/swarm/pss/README.md#pss_getpublickey).

**Returns** `Promise<hex>`

### .sendAsym()

Calls
[`pss_sendAsym`](https://github.com/ethersphere/go-ethereum/tree/swarm-network-rewrite-syncer/swarm/pss/README.md#pss_sendasym)
with the provided arguments:

**Arguments**

1.  `key: hex`: public key of the peer
1.  `topic: hex`: destination topic
1.  `message: hex`

**Returns** `Promise<void>`

### .sendSym()

Calls
[`pss_sendSym`](https://github.com/ethersphere/go-ethereum/tree/swarm-network-rewrite-syncer/swarm/pss/README.md#pss_sendsym)
with the provided arguments:

**Arguments**

1.  `keyID: hex`: symmetric key ID generated using `setSymmetricKey()`
1.  `topic: hex`: destination topic
1.  `message: hex`

**Returns** `Promise<void>`

### .setPeerPublicKey()

Calls
[`pss_setPeerPublicKey`](https://github.com/ethersphere/go-ethereum/tree/swarm-network-rewrite-syncer/swarm/pss/README.md#pss_setpeerpublickey)
with the provided arguments:

**Arguments**

1.  `key: hex`: public key of the peer
1.  `topic: hex`
1.  `address?: hex = '0x'`

**Returns** `Promise<void>`

### .setSymmetricKey()

Calls
[`pss_setSymmetricKey`](https://github.com/ethersphere/go-ethereum/tree/swarm-network-rewrite-syncer/swarm/pss/README.md#pss_setsymmetrickey)
with the provided arguments:

**Arguments**

1.  `key: hex`: public key of the peer
1.  `topic: hex`
1.  `address?: hex = '0x'`
1.  `useForDecryption: boolean = false`

**Returns** `Promise<string>`

#### .stringToTopic()

Calls
[`pss_stringToTopic`](https://github.com/ethersphere/go-ethereum/tree/swarm-network-rewrite-syncer/swarm/pss/README.md#pss_stringtotopic)
with the provided string and returns the generated topic.

**Arguments**

1.  `str: string`

**Returns** `Promise<string>`

### .subscribeTopic()

Calls `pss_subscribe` with the provided topic and returns the subscription handle.

**Arguments**

1.  `topic: hex`

**Returns** `Promise<hex>`

### .createSubscription()

Creates a [RxJS Observable](https://rxjs-dev.firebaseapp.com/api/index/class/Observable) that will emit events matching the provided subscription handle as created by calling `subscribeTopic()` once subscribed to.

**Arguments**

1.  `subscription: hex`

**Returns** `Observable<PssEvent>`

### .createTopicSubscription()

Shortcut for calling `subscribeTopic()` followed by `createSubscription()`.

**Arguments**

1.  `topic: hex`

**Returns** `Promise<Observable<PssEvent>>`
