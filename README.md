# Erebos [![CircleCI](https://img.shields.io/circleci/project/github/RedSparr0w/node-csgo-parser.svg)](https://circleci.com/gh/MainframeHQ/erebos) [![npm](https://img.shields.io/npm/v/erebos.svg)](https://www.npmjs.com/package/erebos)

JavaScript client for [Swarm](https://swarm-gateways.net/bzz:/theswarm.eth/).

## Disclaimer

This library is a work-in-progress client for technologies that are still at
a proof-of-concept stage. It is intended for demonstration purposes only.\
APIs are likely to be changed and even removed between releases without prior notice.

## Installation

```sh
yarn add @erebos/swarm-browser # browser-only
yarn add @erebos/swarm-node # node-only
yarn add @erebos/swarm # universal
```

## Examples

- [Postal Services over Swarm (PSS)](examples/pss.js)
- [Whisper (SHH)](examples/shh.js)

## [Documentation](docs/)

- [Client](docs/client.md)
- [APIs](docs/api.md)
  - [Bzz](docs/api-bzz.md) - file storage
  - [Pss](docs/api-pss.md) - Postal Services over Swarm
  - [Eth](docs/api-eth.md) - Ethereum blockchain
  - [Net](docs/api-net.md) - network
  - [Shh](docs/api-shh.md) - Whisper
  - [Web3](docs/api-web3.md)
- RPC client factory for the [browser](https://github.com/MainframeHQ/js-tools/tree/master/packages/rpc-browser#rpc-browser) or [node](https://github.com/MainframeHQ/js-tools/tree/master/packages/rpc-node#rpc-node) depending on the package.
- [Hexadecimal-encoding utilities](https://github.com/MainframeHQ/js-tools/tree/master/packages/utils-hex#utils-hex)

## Packages

| Name | Version | Description |
| ---- | ------- | ----------- |
| **Clients**
| [`@erebos/swarm`](/packages/swarm) | [![npm version](https://img.shields.io/npm/v/@erebos/swarm.svg)](https://www.npmjs.com/package/@erebos/swarm) | Universal Erebos library for Swarm
| [`@erebos/swarm-browser`](/packages/swarm-browser) | [![npm version](https://img.shields.io/npm/v/@erebos/swarm-browser.svg)](https://www.npmjs.com/package/@erebos/swarm-browser) | Browser-only Erebos library for Swarm
| [`@erebos/swarm-node`](/packages/swarm-node) | [![npm version](https://img.shields.io/npm/v/@erebos/swarm-node.svg)](https://www.npmjs.com/package/@erebos/swarm-node) | Node-only Erebos library for Swarm
| **Standalone APIs**
| [`@erebos/api-bzz-browser`](/packages/api-bzz-browser) | [![npm version](https://img.shields.io/npm/v/@erebos/api-bzz-browser.svg)](https://www.npmjs.com/package/@erebos/api-bzz-browser) | Browser-only Swarm (BZZ) APIs
| [`@erebos/api-bzz-node`](/packages/api-bzz-node) | [![npm version](https://img.shields.io/npm/v/@erebos/api-bzz-node.svg)](https://www.npmjs.com/package/@erebos/api-bzz-node) | Node-only Swarm (BZZ) APIs
| [`@erebos/api-eth`](/packages/api-eth) | [![npm version](https://img.shields.io/npm/v/@erebos/api-eth.svg)](https://www.npmjs.com/package/@erebos/api-eth) | Ethereum (eth) APIs
| [`@erebos/api-net`](/packages/api-net) | [![npm version](https://img.shields.io/npm/v/@erebos/api-net.svg)](https://www.npmjs.com/package/@erebos/api-net) | Net APIs
| [`@erebos/api-pss`](/packages/api-pss) | [![npm version](https://img.shields.io/npm/v/@erebos/api-pss.svg)](https://www.npmjs.com/package/@erebos/api-pss) | Postal Services over Swarm (PSS) APIs
| [`@erebos/api-shh`](/packages/api-shh) | [![npm version](https://img.shields.io/npm/v/@erebos/api-shh.svg)](https://www.npmjs.com/package/@erebos/api-shh) | Whisper (SHH) APIs
| [`@erebos/api-web3`](/packages/api-web3) | [![npm version](https://img.shields.io/npm/v/@erebos/api-web3.svg)](https://www.npmjs.com/package/@erebos/api-eth) | Web3 APIs
| **Base classes**
| [`@erebos/api-bzz-base`](/packages/api-bzz-base) | [![npm version](https://img.shields.io/npm/v/@erebos/api-bzz-base.svg)](https://www.npmjs.com/package/@erebos/api-bzz-base) | Shared logic for Swarm (BZZ) APIs
| [`@erebos/client-base`](/packages/client-base) | [![npm version](https://img.shields.io/npm/v/@erebos/client-base.svg)](https://www.npmjs.com/package/@erebos/client-base) | Shared logic for Client APIs

## Development

### Prerequisites

- [Node](https://nodejs.org/en/) v10+ (includes npm)
- [Yarn](https://yarnpkg.com/lang/en/) (optional - faster alternative to npm)
- [Docker](https://www.docker.com/community-edition)

### Setup

```
yarn install
yarn bootstrap
yarn build
docker build --tag erebos --file Dockerfile.erebos .
```

### Running tests

In one terminal window run:

```
docker run --publish 8500:8500 --interactive --tty erebos
```

And in the second one run:

```
yarn test:all
```

## License

MIT.\
See [LICENSE](LICENSE) file.
