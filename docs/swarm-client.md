---
title: Swarm client
---

The Erebos `SwarmClient` class provides an unified way of interacting with the various APIs based on a provided configuration, or simply a server endpoint.

```js
import { SwarmClient } from '@erebos/swarm-browser' // browser
// or
import { SwarmClient } from '@erebos/swarm-node' // node
// or
import { SwarmClient } from '@erebos/swarm' // universal
```

## RPC class

The Erebos client and individual APIs use RPC classes provided by the [`MainframeHQ/js-tools` repository](https://github.com/MainframeHQ/js-tools#packages), such as [`@mainframe/rpc-browser`](https://github.com/MainframeHQ/js-tools/tree/master/packages/rpc-browser) and [`@mainframe/rpc-node`](https://github.com/MainframeHQ/js-tools/tree/master/packages/rpc-node) depending on the environment.
The relevant factory is exported as `createRPC()` and can be used with [standalone API classes](individual-apis.md) also exported with the client.

## SwarmClient class

Creates a SwarmClient instance based on the provided `config`.\
[`BzzConfig`](api-bzz.md#bzzconfig) is an Object exported by the `@erebos/api-bzz-base` package.

```javascript
type SwarmConfig = {
  bzz?: BzzConfig | BzzAPI,
  http?: string,
  ipc?: string,
  pss?: string | PssAPI,
  rpc?: RPC,
  ws?: string,
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

**Returns** [`BzzAPI` instance](api-bzz.md), or throws if not provided and could not be created.

### .pss

**Returns** [`PssAPI` instance](api-pss.md), or throws if not provided and could not be created.
