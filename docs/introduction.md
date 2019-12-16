---
title: Introduction
---

Erebos is a set of JavaScript tools to build decentralised applications on top of [Swarm](https://swarm-guide.readthedocs.io/en/latest/index.html), created by the [Mainframe team](https://github.com/MainframeHQ) originally for the [PSS-based Onyx messaging application proof of concept](https://github.com/MainframeHQ/onyx) and now used as a core piece of [Mainframe OS](https://github.com/MainframeHQ/mainframe-os).

[Swarm](https://swarm-guide.readthedocs.io/en/latest/index.html) is a distributed storage platform and content distribution network, a native base layer service of the Ethereum web3 stack.\
If you are not familiar with Swarm yet, the [Swarm introduction](https://swarm-guide.readthedocs.io/en/latest/introduction.html) should be a good place to get started.

## Swarm APIs

### Individual packages

The `@erebos/api-bzz-browser` and `@erebos/api-bzz-node` packages expose the [Bzz APIs](api-bzz.md), to interact with files in Swarm. Because some of the methods exported are only available in Node, these packages are environment-specific.

The `@erebos/api-pss` package expose the [Pss APIs](api-pss.md), for communications over Swarm.

### Swarm client

The `@erebos/swarm-browser` and `@erebos/swarm-node` packages expose the [SwarmClient class](swarm-client.md) that includes either `@erebos/api-bzz-browser` (in `@erebos/swarm-browser`) or `@erebos/api-bzz-node` (in `@erebos/swarm-node`) and `@erebos/api-pss`.\
It is meant to be a simple way to get started with Swarm in Node or browser environments.

## Utility packages

- [`@erebos/hex`](hex.md) provides functions to convert to and from hexadecimal-encoded strings.
- [`@erebos/keccak256`](keccak256.md) provides hashing function, notably to derive an Ethereum address from a public key.
- [`@erebos/secp256k1`](secp256k1.md) provides signing functions, notably used to publish Swarm feeds.
- [`@erebos/wallet-hd`](wallet-hd.md) provides a Hierarchical Deterministic wallet interface that can be used to create Ethreum transactions and publish Swarm feeds.

## Additional tools

### Data structures

A few higher-level [data structures](data-structures.md) are implemented on top of Swarm APIs, helping support some common use-cases.

### Command-line interface

The [Erebos CLI](cli.md) provides useful commands to use Swarm's [Bzz](cli.md#bzz-commands) (including [feeds](cli.md#feed-commands)) and [Pss](cli.md#pss-commands) APIs.

It also supports more advanced use cases, such as interacting with [Timelines](cli.md#timeline-commands) and a simple way to publish [static websites](cli.md#website-commands).

### JSON-RPC specification

[Various JSON-RPC libraries](rpc-intro.md) are provided to support communications with Ethereum, Swarm or other JSON-RPC interfaces.
