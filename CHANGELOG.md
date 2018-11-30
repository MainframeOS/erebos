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
