## v0.6.3 (2019-02-04)

Fix `hexValue` return type in `Bzz` upload methods.
Fix Swarm URLs to avoid unnecessary redirects.

## v0.6.2 (2019-01-14)

Fix `hexValue` return type in `Bzz` upload methods.

## v0.6.1 (2019-01-11)

Fixes for TypeScript definitions.

## v0.6.0 (2019-01-09)

This release introduces a large refactoring of feeds interactions, notably to provide some high-level APIs.
As a result, various breaking changes were needed to keep the APIs consistent and provide more security options, as detailed below.

### Breaking changes

#### The Bzz APIs do not provide built-in feed signing anymore

- The `createFeedDigest()` and `createKeyPair()` functions have been removed from the `@erebos/api-bzz-base` and `@erebos/swarm` packages.
- The `Bzz` instance constructor now requires to be provided a [`BzzConfig` object](https://erebos.js.org/docs/api-bzz#bzzconfig) rather than only the HTTP gateway `url`.
- The [`postFeedValue()` method](https://erebos.js.org/docs/api-bzz#postfeedvalue) arguments have changed.

#### HTTP headers must be provided as options

Most Bzz methods arguments have changed, the `headers` that were previously passed as argument must now be provided in the `options` object instead.

### Additional features and APIs

- The [`@erebos/keccak256`](https://erebos.js.org/docs/keccak256) and [`@erebos/secp256k1`](https://erebos.js.org/docs/secp256k1) packages have been added.
- Bzz requests now support a `timeout` option, and a default `timeout` can optionally be set in the [`BzzConfig` object](https://erebos.js.org/docs/api-bzz#bzzconfig) when creating the instance.
- Various feed-related APIs and options have been added. Check the updated [Bzz API documentation](https://erebos.js.org/docs/api-bzz) for more details.

## v0.5.5 (2018-12-14)

Fixes for TypeScript definitions.

## v0.5.3/v0.5.4 (2018-12-12)

- Add support for PSS raw messages introduced in Swarm v0.3.8.
- Add TypeScript definitions for packages.

## v0.5.2 (2018-11-30)

- Fix RPC instance creation.
- Fix PSS subscription method for Swarm v0.3.7.

## v0.5.1 (2018-11-29)

- Fix feed digest signature padding.
- Remove usage of multihash for feed following its [removal in Swarm](https://github.com/ethereum/go-ethereum/pull/18175).

## v0.5.0 (2018-11-19)

- [BREAKING CHANGE] The `PssEvent` object emitted by PSS subscriptions now has a [different shape](https://erebos.js.org/docs/api-pss#pssevent).
- Add support for [Swarm feeds](https://swarm-guide.readthedocs.io/en/latest/usage.html#feeds) - see the updated [Bzz API documentation](https://erebos.js.org/docs/api-bzz).
- Add the `@erebos/hex` package to interact with hexadecimal-encoded strings - see [the added documentation](https://erebos.js.org/docs/hex) for more details.
- Add the `pss` and `website` commands to the CLI - see the updated [CLI documentation](https://erebos.js.org/docs/cli).

## v0.4.x

- Fix `defaultPath` support for uploads in `api-bzz-browser` and `swarm-client`.
- Add `--default-path` flag to `bzz:upload` CLI command.
- Fix flow types related to `fs-extra` usage.
- Add optional `headers` argument to `Bzz` class methods.
- Expose `getDownloadURL()` and `getUploadURL()` utility methods in `Bzz` class.

## v0.4.0 (2018-09-19)

- Use `@erebos` namespace for packages.
- Bzz APIs refactoring.
- Add a CLI: `@erebos/cli`.
- Add a documentation website: [erebos.js.org](https://erebos.js.org)

## v0.3.0 (2018-04-27)

- Split modules into individual packages.
- Move RPC, transport and utilities modules to [MainframeHQ/js-tools](https://github.com/MainframeHQ/js-tools).
- Update RxJS dependency to v6.

## v0.2.0 (2018-03-02)

- Remove `createPSSWebSocket()`.
- Rename `BZZ` to `BzzAPI`, `PSS` to `PssAPI` and `RPC` to `StreamRPC`.
- Add `EthAPI`, `NetAPI`, `ShhAPI`, `Web3API` and `RequestRPC` classes.
- Add transports and `rpc()` factories.
- Add `Client` class.
- Update documentation and add Whisper example.

## v0.1.0 (2017-12-07)

Breaking API change in PSS, use
[the `pss-apimsg-hex` branch of `MainframeHQ/go-ethereum`](https://github.com/MainframeHQ/go-ethereum/tree/pss-apimsg-hex)
to build Swarm.

## v0.1.0-0 (beta)

Update PSS APIs to use arguments as hex following
[`ethersphere/go-ethereum#140`](https://github.com/ethersphere/go-ethereum/pull/140).

## v0.0.1 (2017-11-13)

First release.
