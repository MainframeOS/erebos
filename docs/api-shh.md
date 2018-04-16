# Whisper (SHH) API

```js
import Shh from 'erebos-api-shh'
```

## Types

```js
type ShhInfo = {
  memory: number,
  messages: number,
  minPow: number,
  maxMessageSize: number,
}

type ShhFilterCriteria = {
  symKeyID?: string,
  privateKeyID?: string,
  sig?: hex,
  minPow?: number,
  topics: Array<hex>,
  allowP2P?: boolean,
}

type ShhPostMessage = {
  symKeyID?: string,
  pubKey?: hex,
  sig?: string,
  ttl?: number,
  topic: hex,
  payload: hex,
  padding?: hex,
  powTime?: number,
  powTarget?: number,
  targetPeer?: string,
}

type ShhReceivedMessage = {
  sig?: hex,
  ttl: number,
  timestamp: number,
  topic: hex,
  payload: hex,
  padding: hex,
  pow: number,
  hash: number,
  recipientPublicKey?: hex,
}
```

## Class

### new Shh()

Creates a Shh instance using the provided `rpc` handler.

**Arguments**

1.  `rpc: RPC`

### .version()

**Returns** `Promise<string>`

### .info()

**Returns** `Promise<ShhInfo>`

### .setMaxMessageSize()

**Arguments**

1.  `size: number`

**Returns** `Promise<boolean>`

### .setMinPow()

**Arguments**

1.  `pow: number`

**Returns** `Promise<boolean>`

### .setBloomFilter()

**Arguments**

1.  `bloom: hex`

**Returns** `Promise<boolean>`

### .markTrustedPeer()

**Arguments**

1.  `enode: string`

**Returns** `Promise<boolean>`

### .newKeyPair()

**Returns** `Promise<string>`

### .addPrivateKey()

**Arguments**

1.  `key: hex`

**Returns** `Promise<string>`

### .deleteKeyPair()

**Arguments**

1.  `id: string`

**Returns** `Promise<boolean>`

### .hasKeyPair()

**Arguments**

1.  `id: string`

**Returns** `Promise<boolean>`

### .getPublicKey()

**Arguments**

1.  `id: string`

**Returns** `Promise<hex>`

### .getPrivateKey()

**Arguments**

1.  `id: string`

**Returns** `Promise<hex>`

### .newSymKey()

**Returns** `Promise<string>`

### .addSymKey()

**Arguments**

1.  `key: hex`

**Returns** `Promise<string>`

### .generateSymKeyFromPassword()

**Arguments**

1.  `password: string`

**Returns** `Promise<string>`

### .hasSymKey()

**Arguments**

1.  `id: string`

**Returns** `Promise<boolean>`

### .getSymKey()

**Arguments**

1.  `id: string`

**Returns** `Promise<hex>`

### .deleteSymKey()

**Arguments**

1.  `id: string`

**Returns** `Promise<boolean>`

### .post()

**Arguments**

1.  `msg: ShhPostMessage`

**Returns** `Promise<boolean>`

### .getFilterMessages()

**Arguments**

1.  `id: string`

**Returns** `Promise<Array<ShhReceivedMessage>>`

### .deleteMessageFilter()

**Arguments**

1.  `id: string`

**Returns** `Promise<boolean>`

### .newMessageFilter()

**Arguments**

1.  `criteria: ShhFilterCriteria`

**Returns** `Promise<string>`
