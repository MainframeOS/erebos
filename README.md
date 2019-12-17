# Erebos [![Build Status](https://travis-ci.com/MainframeHQ/erebos.svg?branch=master)](https://travis-ci.com/MainframeHQ/erebos) [![Gitter](https://badges.gitter.im/MainframeHQ/erebos.svg)](https://gitter.im/MainframeHQ/erebos) [![Last release](https://img.shields.io/github/release/MainframeHQ/erebos.svg)](https://github.com/MainframeHQ/erebos/releases)

JavaScript client and CLI for [Swarm](https://swarm-guide.readthedocs.io/en/latest/index.html).

## Installation

Node.js v10+ is required to use the Node.js APIs and run the CLI.

### Client library

```sh
npm install @erebos/swarm-browser # browser-only
npm install @erebos/swarm-node # node-only
npm install @erebos/swarm # universal
```

### CLI

```sh
npm install -g @erebos/cli
```

## [Documentation](https://erebos.js.org)

- [Getting started](https://erebos.js.org/docs/getting-started)
- [API reference](https://erebos.js.org/docs/swarm-client)

## Packages

#### Platform symbols

⚛️ Electron | ⚙️ Node | 📱 React-Native | 🌐 Web browsers

| Name | Version | Platform | Description |
| ---- | ------- | -------- | ----------- |
| **Clients**
| [`@erebos/swarm`](/packages/swarm) | [![npm version](https://img.shields.io/npm/v/@erebos/swarm.svg)](https://www.npmjs.com/package/@erebos/swarm) | ⚛️ ⚙️ 🌐 | Universal Erebos library for Swarm
| [`@erebos/swarm-browser`](/packages/swarm-browser) | [![npm version](https://img.shields.io/npm/v/@erebos/swarm-browser.svg)](https://www.npmjs.com/package/@erebos/swarm-browser) | 🌐 | Browser-only Erebos library for Swarm
| [`@erebos/swarm-node`](/packages/swarm-node) | [![npm version](https://img.shields.io/npm/v/@erebos/swarm-node.svg)](https://www.npmjs.com/package/@erebos/swarm-node)| ⚛️ ⚙️ | Electron and Node Erebos library for Swarm
| **CLI**
| [`@erebos/cli`](/packages/cli) | [![npm version](https://img.shields.io/npm/v/@erebos/cli.svg)](https://www.npmjs.com/package/@erebos/cli) |
| **Individual Swarm APIs**
| [`@erebos/api-bzz-browser`](/packages/api-bzz-browser) | [![npm version](https://img.shields.io/npm/v/@erebos/api-bzz-browser.svg)](https://www.npmjs.com/package/@erebos/api-bzz-browser) | 🌐 | Browser-only Swarm (BZZ) APIs
| [`@erebos/api-bzz-node`](/packages/api-bzz-node) | [![npm version](https://img.shields.io/npm/v/@erebos/api-bzz-node.svg)](https://www.npmjs.com/package/@erebos/api-bzz-node) | ⚛️ ⚙️ | Electron and Node Swarm (BZZ) APIs
| [`@erebos/api-bzz-react-native`](/packages/api-bzz-react-native) | [![npm version](https://img.shields.io/npm/v/@erebos/api-bzz-react-native.svg)](https://www.npmjs.com/package/@erebos/api-bzz-react-native) | 📱 | Experimental React Native Swarm (BZZ) APIs
| [`@erebos/api-pss`](/packages/api-pss) | [![npm version](https://img.shields.io/npm/v/@erebos/api-pss.svg)](https://www.npmjs.com/package/@erebos/api-pss) | ⚛️ ⚙️ 📱 🌐 | Postal Services over Swarm (PSS) APIs
| **Higher-level APIs**
| [`@erebos/feed-list`](/packages/feed-list) | [![npm version](https://img.shields.io/npm/v/@erebos/feed-list.svg)](https://www.npmjs.com/package/@erebos/feed-list) | ⚛️ ⚙️ 📱 🌐 | List APIs using raw Swarm feeds
| [`@erebos/timeline`](/packages/timeline) | [![npm version](https://img.shields.io/npm/v/@erebos/timeline.svg)](https://www.npmjs.com/package/@erebos/timeline) | ⚛️ ⚙️ 📱 🌐 | Feed-based Timeline APIs
| **Ethereum and Swarm utilities**
| [`@erebos/hex`](/packages/hex) | [![npm version](https://img.shields.io/npm/v/@erebos/hex.svg)](https://www.npmjs.com/package/@erebos/hex) | ⚛️ ⚙️ 📱 🌐 | Hexadecimal values encoding and decoding
| [`@erebos/keccak256`](/packages/keccak256) | [![npm version](https://img.shields.io/npm/v/@erebos/keccak256.svg)](https://www.npmjs.com/package/@erebos/keccak256) | ⚛️ ⚙️ 🌐 | Keccak256 hashing
| [`@erebos/secp256k1`](/packages/secp256k1) | [![npm version](https://img.shields.io/npm/v/@erebos/secp256k1.svg)](https://www.npmjs.com/package/@erebos/secp256k1) | ⚛️ ⚙️ 🌐 | ECDSA key creation and signing using the SECP256k1 curve
| [`@erebos/wallet-hd`](/packages/wallet-hd) | [![npm version](https://img.shields.io/npm/v/@erebos/wallet-hd.svg)](https://www.npmjs.com/package/@erebos/wallet-hd) | ⚛️ ⚙️ | Hierarchical Deterministic wallet
| **RPC utilities**
| [`@erebos/rpc-error`](/packages/rpc-error) | [![npm version](https://img.shields.io/npm/v/@erebos/rpc-error.svg)](https://www.npmjs.com/package/@erebos/rpc-error) | ⚛️ ⚙️ 📱 🌐 | RPC error class and factories
| [`@erebos/rpc-handler`](/packages/rpc-handler) | [![npm version](https://img.shields.io/npm/v/@erebos/rpc-handler.svg)](https://www.npmjs.com/package/@erebos/rpc-handler) | ⚛️ ⚙️ | RPC requests handling helpers
| [`@erebos/rpc-request`](/packages/rpc-request) | [![npm version](https://img.shields.io/npm/v/@erebos/rpc-request.svg)](https://www.npmjs.com/package/@erebos/rpc-request) | ⚛️ ⚙️ | Stateless RPC client class
| [`@erebos/rpc-stream`](/packages/rpc-stream) | [![npm version](https://img.shields.io/npm/v/@erebos/rpc-stream.svg)](https://www.npmjs.com/package/@erebos/rpc-stream) | ⚛️ ⚙️ | Statefull RPC client class
| [`@erebos/rpc-http-browser`](/packages/rpc-http-browser) | [![npm version](https://img.shields.io/npm/v/@erebos/rpc-http-browser.svg)](https://www.npmjs.com/package/@erebos/rpc-http-browser) | 🌐 | RPC client factory over HTTP for browsers
| [`@erebos/rpc-http-node`](/packages/rpc-http-node) | [![npm version](https://img.shields.io/npm/v/@erebos/rpc-http-node.svg)](https://www.npmjs.com/package/@erebos/rpc-http-node) | ⚙️ | RPC client factory over HTTP for Node
| [`@erebos/rpc-ws-browser`](/packages/rpc-ws-browser) | [![npm version](https://img.shields.io/npm/v/@erebos/rpc-ws-browser.svg)](https://www.npmjs.com/package/@erebos/rpc-ws-browser) | 🌐 | RPC client factory over WebSocket for browsers
| [`@erebos/rpc-ws-node`](/packages/rpc-ws-node) | [![npm version](https://img.shields.io/npm/v/@erebos/rpc-ws-node.svg)](https://www.npmjs.com/package/@erebos/rpc-ws-node) | ⚙️ | RPC client factory over WebSocket for Node
| [`@erebos/rpc-ipc`](/packages/rpc-ipc) | [![npm version](https://img.shields.io/npm/v/@erebos/rpc-ipc.svg)](https://www.npmjs.com/package/@erebos/rpc-ipc) | ⚙️ | RPC client factory over IPC
| [`@erebos/rpc-browser`](/packages/rpc-browser) | [![npm version](https://img.shields.io/npm/v/@erebos/rpc-browser.svg)](https://www.npmjs.com/package/@erebos/rpc-browser) | 🌐 | RPC client factory for browsers
| [`@erebos/rpc-electron`](/packages/rpc-electron) | [![npm version](https://img.shields.io/npm/v/@erebos/rpc-electron.svg)](https://www.npmjs.com/package/@erebos/rpc-electron) | ⚛️ | RPC client factory for Electron
| [`@erebos/rpc-node`](/packages/rpc-node) | [![npm version](https://img.shields.io/npm/v/@erebos/rpc-node.svg)](https://www.npmjs.com/package/@erebos/rpc-node) | ⚙️ | RPC client factory for Node
| **Transports**
| [`@erebos/transport-http-browser`](/packages/transport-http-browser) | [![npm version](https://img.shields.io/npm/v/@erebos/transport-http-browser.svg)](https://www.npmjs.com/package/@erebos/transport-http-browser) | 🌐 | HTTP transport for browsers
| [`@erebos/transport-http-node`](/packages/transport-http-node) | [![npm version](https://img.shields.io/npm/v/@erebos/transport-http-node.svg)](https://www.npmjs.com/package/@erebos/transport-http-node) | ⚙️ | HTTP transport for Node
| [`@erebos/transport-ws-browser`](/packages/transport-ws-browser) | [![npm version](https://img.shields.io/npm/v/@erebos/transport-ws-browser.svg)](https://www.npmjs.com/package/@erebos/transport-ws-browser) | 🌐 | WebSocket transport for browsers
| [`@erebos/transport-ws-node`](/packages/transport-ws-node) | [![npm version](https://img.shields.io/npm/v/@erebos/transport-ws-node.svg)](https://www.npmjs.com/package/@erebos/transport-ws-node) | ⚙️ | WebSocket transport for Node
| [`@erebos/transport-electron`](/packages/transport-electron) | [![npm version](https://img.shields.io/npm/v/@erebos/transport-electron.svg)](https://www.npmjs.com/package/@erebos/transport-electron) | ⚛️ | IPC transport for Electron
| [`@erebos/transport-ipc`](/packages/transport-ipc) | [![npm version](https://img.shields.io/npm/v/@erebos/transport-ipc.svg)](https://www.npmjs.com/package/@erebos/transport-ipc) | ⚙️ | IPC transport for Node
| **Base classes**
| [`@erebos/api-bzz-base`](/packages/api-bzz-base) | [![npm version](https://img.shields.io/npm/v/@erebos/api-bzz-base.svg)](https://www.npmjs.com/package/@erebos/api-bzz-base) | ⚛️ ⚙️ 📱 🌐 | Shared logic for Swarm (BZZ) APIs
| [`@erebos/client-base`](/packages/client-base) | [![npm version](https://img.shields.io/npm/v/@erebos/client-base.svg)](https://www.npmjs.com/package/@erebos/client-base) | ⚛️ ⚙️ 📱 🌐 | Shared logic for Client APIs
| [`@erebos/rpc-base`](/packages/rpc-base) | [![npm version](https://img.shields.io/npm/v/@erebos/rpc-base.svg)](https://www.npmjs.com/package/@erebos/rpc-base) | ⚛️ ⚙️ 📱 🌐 | Shared logic for RPC clients

## Development

### Prerequisites

- [Node](https://nodejs.org/en/) v10+ (includes npm)
- [Yarn](https://yarnpkg.com/lang/en/)
- [Docker](https://www.docker.com/community-edition)

### Setup

```
yarn install
yarn start
```

### Running tests

In one terminal window run:

```
./start_swarm_node.sh
```

And in the second one run:

```
yarn test:all
```

## License

MIT.\
See [LICENSE](LICENSE) file.
