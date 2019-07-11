---
title: Getting started
---

## Prerequisites

To get started using Swarm and Erebos, you will need to be able to connect to a Swarm node.\
The Swarm team has deployed a HTTP gateway to [swarm-gateways.net](https://swarm-gateways.net/), but it only supports file storage (Bzz APIs).\
If you want to use Pss APIs, you should first [install](https://swarm-guide.readthedocs.io/en/latest/installation.html) and [run](https://swarm-guide.readthedocs.io/en/latest/gettingstarted.html) a Swarm node locally.

Make sure the versions of Swarm and Erebos you are using are compatible - there are potential breaking changes between Swarm patch releases (x.y.z) and Erebos minor releases (x.y.0).
Node.js v10+ is required to use the Node.js APIs and run the CLI.

## If you are new to Swarm

This documentation assumes the reader already knows about Swarm, it does not replace Swarm's documentation. If you are not familiar with it already, you should start by reading the [official Swarm documentation](https://swarm-guide.readthedocs.io/en/latest/).

If you want to start interacting with Swarm before writting code, you might want to try out the [Erebos CLI](cli.md) that exposes commands for the main Swarm APIs.\
You might also want to get familiar with the [various tools exposed by Erebos](introduction.md) if you don't know them yet.

Finally, you can read about the [browser](#browser-setup) and [Node](#node-setup) setup for Erebos.

## If you already know Swarm

If you are looking for a JavaScript client for Swarm, you can read about the [browser](#browser-setup) and [Node](#node-setup) setup.

Erebos also provides various [utility libraries](introduction.md#utility-packages) for encoding, hashing and signing, and a high-level data structure on top of Swarm feeds that can be useful for many application use cases: the [Timeline](timeline-spec.md).

Finally, the [CLI](cli.md) can be a useful tool to simply interact with Swarm.

## Browser setup

⚠️ Erebos is only tested against a recent version of Chromium. Only evergreen browsers are supported.

If you are bundling JavaScript assets, the simplest way to get started is to install and import the `@erebos/swarm-browser` package:

```sh
npm install @erebos/swarm-browser
```

```javascript
import { SwarmClient } from '@erebos/swarm-browser'
```

Alternatively, browser builds are exported in the `dist` folder:

- `@erebos/swarm-browser/dist/erebos.swarm.development.js` for development.
- `@erebos/swarm-browser/dist/erebos.swarm.production.js` for production (minified).

These files can be loaded from [unpkg](https://unpkg.com) in [production](https://unpkg.com/@erebos/swarm-browser/dist/erebos.swarm.production.js) and [development](https://unpkg.com/@erebos/swarm-browser/dist/erebos.swarm.development.js) variants.

The browser builds inject the APIs in the `Erebos.swarm` namespace, that can be used as:

```javascript
const swarm = new Erebos.swarm.SwarmClient({
  bzz: { url: 'http://localhost:8500' },
})
```

[The API documentation about `@erebos/swarm-browser` can be found here.](swarm-client.md)

If your usage is limited to Bzz or Pss APIs, using the [individual APIs](individual-apis.md) and packaging them with your code should help reduce the bundle size.

## Node setup

⚠️ Erebos is only tested against Node.js v10 (LTS), it does not work with older versions and may not work with more recent ones.

The simplest way to get started is to install and import the `@erebos/swarm-node` package:

```sh
npm install @erebos/swarm-node
```

```javascript
import { SwarmClient } from '@erebos/swarm-node'
```

[The API documentation about `@erebos/swarm-node` can be found here.](swarm-client.md)

Rather than using the `SwarmClient` class described in the [basic setup](#basic-node-setup), the [Bzz and Pss APIs can be used individualy](individual-apis.md).
