# Erebos Swarm Client

The Erebos `SwarmClient` class provides an unified way of interacting with the various APIs based on a provided configuration, or simply a server endpoint.

```js
import { SwarmClient } from '@erebos/swarm-browser' // browser
// or
import { SwarmClient } from '@erebos/swarm-node' // node
// or
import { SwarmClient } from '@erebos/swarm' // universal
```

### new SwarmClient()

Creates a SwarmClient instance based on the provided `config`.\
If `config` is a string, it will be provided to the [`rpc()`](rpc.md) factory function to create a RPC instance used by the various APIs.\
When `config` is an Object, the Client will use the provided APIs and transports.

```js
type ClientConfig = {
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

### .rpc

**Returns** [`RPC` instance](rpc.md), or throws if not provided and could not be created.

### .bzz

**Returns** [`BzzAPI` instance](api-bzz.md), or throws if not provided and could not be created.

### .pss

**Returns** [`PssAPI` instance](api-pss.md), or throws if not provided and could not be created.
