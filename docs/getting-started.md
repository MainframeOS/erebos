---
title: Getting started
---

## Prerequisites

To get started using Swarm and Erebos, you will need to be able to connect to a Swarm node.\
The Swarm team has deployed a HTTP gateway to [swarm-gateways.net/](https://swarm-gateways.net/), but it only supports file storage (Bzz APIs).\
If you want to use Pss APIs, you should first [install](https://swarm-guide.readthedocs.io/en/latest/installation.html) and [run](https://swarm-guide.readthedocs.io/en/latest/gettingstarted.html) a Swarm node locally.

## Installation

Erebos can be used both in node and browser environments, and comes in different flavours:

- An "universal" library when using `@erebos/swarm`, assuming you use a tool such as [webpack](https://webpack.js.org/) to bundle your assets.
- A node-only library using `@erebos/swarm-node`.
- A browser-only library using `@erebos/swarm-browser`.

All the packages exported by Erebos can be installed from using a npm, example:

```sh
npm install @erebos/swarm-node
```
