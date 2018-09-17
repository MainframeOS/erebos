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
The relevant factory is exported as `createRPC()` and can be used with [standalone API classes](api.md) also exported with the client.

## SwarmClient class

Creates a SwarmClient instance based on the provided `config`.\
If `config` is a string, it will be provided to the `createRPC()` factory function to create a RPC instance used by the various APIs.\
When `config` is an Object, the SwarmClient will use the provided APIs and transports.

```javascript
type SwarmConfig = {
  bzz?: string | BzzAPI,
  http?: string,
  ipc?: string,
  pss?: string | PssAPI,
  rpc?: RPC,
  ws?: string,
}
```

**Arguments**

1.  `config: string | SwarmConfig`

### .bzz

**Returns** [`BzzAPI` instance](api-bzz.md), or throws if not provided and could not be created.

### .pss

**Returns** [`PssAPI` instance](api-pss.md), or throws if not provided and could not be created.
