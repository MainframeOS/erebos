## v0.9.0 (unreleased)

### Breaking changes

#### TypeScript rewrite

The main change in this release is that the code based has been rewritten in TypeScript. As part of these changes, the library no longer uses ES modules `default` exports but only named exports, such as:

- `import { Bzz } from '@erebos/api-bzz-node'`
- `import { Pss } from '@erebos/api-pss'`
- `import { createHex } from '@erebos/hex'`

#### Pss module changes

- The `EMPTY_HEX` constant has been renamed to `EMPTY_ADDRESS`.
- The `sendRaw()`, `setPeerPublicKey()` and `setSymmetricKey()` methods of the `Pss` class no longer set a default `address` value, use `EMPTY_ADDRESS` if needed.

#### Browser module namespacing

The `@erebos/swarm-browser` package now exports its contents in the `Erebos.swarm` namespace instead of `Erebos`. For example `Erebos.swarm.SwarmClient()` should be used instead of `Erebos.SwarmClient()`.  
The browser builds (in the `dist` folder) have been renamed from `erebos.development.js` and `erebos.production.js` to `erebos.swarm.development.js` and `erebos.swarm.production.js` to better reflect this change.

### Additional features

- The `downloadTarTo()` method has been added to `@erebos/api-bzz-node`.

### Other changes

- The `sign()` and `verify()` functions exported by the `@erebos/secp256k1` package now accept a `BNInput` input value as exported by the `elliptic` package.
- The `addChapter()` method of the `Timeline` class now calls `createChapter()`, so default values for the chapter will be injected.
- The docs have been updated to expose TypeScript interfaces rather than Flow types.

## v0.8.1 (2019-06-17)

- Add missing `rxjs` dependency to `@erebos/api-bzz-base` package.
- Fix TypeScript definition for `@erebos/api-bzz-base` package.

## v0.8.0 (2019-05-28)

### Breaking changes

- The `FeedMode` and `FeedOptions` types have been removed, their use cases are implemented by new methods.
- The `mode` and `contentChangedOnly` fields have been removed from the [`PollOptions`](https://erebos.js.org/docs/api-bzz#polloptions) object.
- The `xxxFeedValue()` methods of the Bzz class have been changed as follows:
  - `getFeedValue()`
    - [`getFeedChunk()`](https://erebos.js.org/docs/api-bzz#getfeedchunk) to load the chunk itself
    - [`getFeedContentHash()`](https://erebos.js.org/docs/api-bzz#getfeedcontentHash) to load the chunk and parse the response as a Swarm hash
    - [`getFeedContent()`](https://erebos.js.org/docs/api-bzz#getfeedcontent) to load the chunk, parse the response as a Swarm hash and load the referenced resource
  - `pollFeedValue()`
    - [`pollFeedChunk()`](https://erebos.js.org/docs/api-bzz#pollfeedchunk) to poll the chunk itself
    - [`pollFeedContentHash()`](https://erebos.js.org/docs/api-bzz#pollfeedcontentHash) to poll the chunk and parse the response as a Swarm hash
    - [`pollFeedContent()`](https://erebos.js.org/docs/api-bzz#pollfeedcontent) to poll the chunk, parse the response as a Swarm hash and load the referenced resource
  - `postSignedFeedValue()` -> [`postSignedFeedChunk()`](https://erebos.js.org/docs/api-bzz#postsignedfeedchunk)
  - `postFeedValue()` -> [`postFeedChunk()`](https://erebos.js.org/docs/api-bzz#postfeedchunk)
  - `updateFeedValue()` -> [`setFeedChunk()`](https://erebos.js.org/docs/api-bzz#setfeedchunk)
  - `uploadFeedValue()` -> [`setFeedContent()`](https://erebos.js.org/docs/api-bzz#setfeedcontent)
- Various Timeline methods have been renamed to be more explicit:
  - `download()` -> [`getChapter()`](https://erebos.js.org/docs/timeline-api#getchapter)
  - `upload()` -> [`postChapter()`](https://erebos.js.org/docs/timeline-api#postchapter)
  - `getChapterID()` -> [`getLatestChapterID()`](https://erebos.js.org/docs/timeline-api#getlatestchapterid)
  - `loadChapter()` -> [`getLatestChapter()`](https://erebos.js.org/docs/timeline-api#getlatestchapter)
  - `updateChapterID()` -> [`setLatestChapterID()`](https://erebos.js.org/docs/timeline-api#setlatestchapterid)
  - `createUpdater()` -> [`createAddChapter()`](https://erebos.js.org/docs/timeline-api#createaddchapter)
  - `loadChapters()` -> [`getChapters()`](https://erebos.js.org/docs/timeline-api#getchapters)

### Additional features

- The [`@erebos/wallet-hd`](https://erebos.js.org/docs/wallet-hd) utility package has been added, providing a simple way to use Hierarchical Deterministic wallets.
- The [`PollContentHashOptions`](https://erebos.js.org/docs/api-bzz#pollcontenthashoptions) and [`PollContentOptions`](https://erebos.js.org/docs/api-bzz#pollcontentoptions) have been added for the [`pollFeedContentHash()`](https://erebos.js.org/docs/api-bzz#pollfeedcontentHash) and [`pollFeedContent()`](https://erebos.js.org/docs/api-bzz#pollfeedcontent) methods, respectively.
- The [`setFeedContentHash()`](https://erebos.js.org/docs/api-bzz#setfeedcontenthash) method has been added to the Bzz class.
- New methods have been added to the Timeline class:
  - [`setLatestChapter()`](https://erebos.js.org/docs/timeline-api#setlatestchapter): sets the latest chapter without checking the `previous` field, while the logic of [`addChapter()`](https://erebos.js.org/docs/timeline-api#addchapter) has been changed to retrieve the latest chapter ID before adding the new chapter when the `previous` field is not provided.
  - [`createLoader()`](https://erebos.js.org/docs/timeline-api#createloader): returns an Observable of chapters.
  - [`pollLatestChapter()`](https://erebos.js.org/docs/timeline-api#polllatestchapter): returns an Observable of the latest chapter.
- Additional commands have been added in the CLI to interact with [feeds](https://erebos.js.org/docs/cli#feed-commands) and [timelines](https://erebos.js.org/docs/cli#timeline-commands).

### Other changes

The library is now tested against [Swarm v0.4.0](https://www.reddit.com/r/ethswarm/comments/bpqxeu/swarm_v040_released/), using the [Docker image provided by ethersphere](https://hub.docker.com/r/ethdevops/swarm).

## v0.7.2 (2019-04-15)

Fix `FeedParams` type in `@erebos/api-bzz-base`.

## v0.7.1 (2019-03-18)

- Add `FeedTopicParams` type to `@erebos/api-bzz-base`.
- Fix `getFeedTopic()` function in `@erebos/api-bzz-base` to use `FeedTopicParams` as input type.

## v0.7.0 (2019-03-18)

### Breaking changes

- The [feed parameters object](https://erebos.js.org/docs/api-bzz#feedparams) has been changed to include the required `user` field and remove the `signature` one. The added [feed update parameters object](https://erebos.js.org/docs/api-bzz#feedupdateparams) should be used for feed updates.
- The feed-related Bzz methods arguments have changed as the result of the feed parameters object change: rather than having a mandatory "user or hash" argument and a separate feed parameters argument, a single "hash or feed parameters" argument is now used. This change affects the [`getFeedURL()`](https://erebos.js.org/docs/api-bzz#getfeedurl), [`createFeedManifest()`](https://erebos.js.org/docs/api-bzz#createfeedmanifest), [`getFeedMetadata()`](https://erebos.js.org/docs/api-bzz#getfeedmetadata), [`getFeedValue()`](https://erebos.js.org/docs/api-bzz#getfeedvalue), [`pollFeedValue()`](https://erebos.js.org/docs/api-bzz#pollfeedvalue), [`postSignedFeedValue()`](https://erebos.js.org/docs/api-bzz#postsignedfeedvalue), [`postFeedValue()`](https://erebos.js.org/docs/api-bzz#postfeedvalue), [`updateFeedValue()`](https://erebos.js.org/docs/api-bzz#updatefeedvalue) and [`uploadFeedValue()`](https://erebos.js.org/docs/api-bzz#uploadfeedvalue) methods.
- The feed digest signing function in the [Bzz class configuration](https://erebos.js.org/docs/api-bzz#bzzconfig) has been renamed from `signFeedDigest` to `signBytes`, to reflect the fact it could be used in other contexts.
- The second argument of the `createKeyPair()` function in `@erebos/secp256k1` has been removed, as `hex` is the only supported value it is set by default.

### Additional features

- The `@erebos/hex` module now supports bytes array (`Array<number>`) as an input type and output using the [`.toBytesArray()` method](https://erebos.js.org/docs/hex#tobytesarray).
- The `createPublic()` and `verify()` functions have been added to the [`@erebos/secp256k1` package](https://erebos.js.org/docs/secp256k1).
- The `@erebos/timeline` package has been added, providing an implementation of the [Timeline protocol](https://erebos.js.org/docs/timeline-spec). Its API is available in [the documentation website](https://erebos.js.org/docs/timeline-api).

### Other changes

The website has been redesigned and additional examples have been added: [erebos.js.org](https://erebos.js.org)

## v0.6.3 (2019-02-04)

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
