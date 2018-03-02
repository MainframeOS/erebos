# Erebos documentation

The Erebos library exposes modules split into 3 layers:

* [APIs](api.md) to interact with Ethereum and Swarm.
* [RPC handlers](rpc.md) used by the APIs to handle the interactions.
* [Transports](transport.md) used by the RPC handlers to communicate with the wanted server.

Additional [utilities](util.md) are also provided to convert value to and from the `hex` type (hexadecimal-encoded `string` prefixed with `0x`) used in the library.

The various API classes can be used independently, but the Erebos [`Client` class](client.md) can provide a single instance to use the APIs injected to it, or lazily instantiate them when accessed.

### Client usage examples

```js
import { Client, PssAPI, webSocketRPC, StreamRPC, ipcTransport } from 'erebos'

// Basic client creation over a single endpoint
async function basic() {
  const client = new Client('http://localhost:8500')
  const version = await client.web3.clientVersion()
}

// Basic client creation over a single endpoint
async function basicWithPss() {
  const client = new Client({
    ws: 'ws://localhost:8501', // Option 1: provide an endpoint supporting streaming, transport will be created and used for PSS
    pss: 'ws://localhost:8501', // Option 2: explicit transport endpoint for PSS
    pss: new PssAPI(webSocketRPC('ws://localhost:8501')), // Option 3: explicit API injection
  })
  const pubKey = await client.pss.getPublicKey()
}

async function pssOnly() {
  const transport = ipcTransport('/path/to/geth.ipc')
  const rpc = new StreamRPC(transport)
  const pss = new PssAPI(rpc)
  const pubKey = await pss.getPublicKey()
}
```

Additional examples are provided in the `examples` folder of the repository.
