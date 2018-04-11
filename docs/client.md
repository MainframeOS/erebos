# Erebos Client

The Erebos `Client` class provides an unified way of interacting with the various APIs based on a provided configuration, or simply a server endpoint.

### new Client()

Creates a Client instance based on the provided `config`.\
If `config` is a string, it will be provided to the [`rpc()`](rpc.md) factory function to create a RPC instance used by the various APIs.\
When `config` is an Object, the Client will use the provided APIs and transports.

```js
type ClientConfig = {
  bzz?: string | BzzAPI,
  eth?: string | EthAPI,
  http?: string,
  ipc?: string,
  net?: string | NetAPI,
  pss?: string | PssAPI,
  rpc?: RPC,
  shh?: string | ShhAPI,
  web3?: string | Web3API,
  ws?: string,
}
```

**Arguments**

1.  `config: string | ClientConfig`

### .rpc

**Returns** [`RPC` instance](rpc.md), or throws if not provided and could not be created.

### .bzz

**Returns** [`BzzAPI` instance](api-bzz.md), or throws if not provided and could not be created.

### .eth

**Returns** [`EthAPI` instance](api-eth.md), or throws if not provided and could not be created.

### .net

**Returns** [`NetAPI` instance](api-net.md), or throws if not provided and could not be created.

### .pss

**Returns** [`PssAPI` instance](api-pss.md), or throws if not provided and could not be created.

### .shh

**Returns** [`ShhAPI` instance](api-shh.md), or throws if not provided and could not be created.

### .web3

**Returns** [`Web3API` instance](api-web3.md), or throws if not provided and could not be created.
