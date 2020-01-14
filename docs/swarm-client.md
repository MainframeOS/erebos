---
title: Swarm client
---

The Erebos `SwarmClient` class provides an unified way of interacting with the Swarm APIs based on a provided configuration, or simply a server endpoint.

```javascript
import { SwarmClient } from '@erebos/swarm-browser' // browser
// or
import { SwarmClient } from '@erebos/swarm-node' // node
// or
import { SwarmClient } from '@erebos/swarm' // universal
```

## RPC class

The Erebos client and individual APIs use RPC classes such as [`@erebos/rpc-browser`](https://github.com/MainframeHQ/erebos/tree/master/packages/rpc-browser) and [`@erebos/rpc-node`](https://github.com/MainframeHQ/erebos/tree/master/packages/rpc-node) depending on the environment.
The relevant factory is exported as `createRPC()` and can be used with [standalone API classes](individual-apis.md) also exported with the client.

## SwarmClient class

Creates a SwarmClient instance based on the provided `config`.
[`BzzConfig`](bzz.md#bzzconfig) is an Object exported by the `@erebos/bzz` package.

```typescript
interface SwarmConfig {
  bzz?: BzzConfig | Bzz
  http?: string
  ipc?: string
  pss?: string | Pss
  rpc?: RPC
  ws?: string
}
```

**Arguments**

1.  `config: SwarmConfig`

**Examples**

```javascript
const client = new SwarmClient({
  bzz: { url: 'http://localhost:8500' },
  ipc: '/path/to/swarm.ipc', // will be used to interact with PSS
})
```

### .bzz

**Returns** [`Bzz` instance](bzz.md), or throws if not provided and could not be created.

### .pss

**Returns** [`Pss` instance](pss.md), or throws if not provided and could not be created.
