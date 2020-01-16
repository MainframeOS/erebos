## v0.13.1 (2020-01-16)

- Fix type signature of the `write()` method of `TimelineWriter`.
- Bump dependency version of `@erebos/hex` in `@erebos/keccak256`.

## v0.13.0 (2020-01-16)

### Breaking changes

- The `bzz`-related packages have been refactored, the `@erebos/api-bzz-base`, `@erebos/api-bzz-browser` and `@erebos/api-bzz-node` packages are discontinued and should be replaced by `@erebos/bzz`, `@erebos/bzz-browser`, `@erebos/bzz-node`, `@erebos/bzz-feed` and `@erebos/bzz-fs` depending on the use cases, see below.
- The `@erebos/api-pss` package has been renamed to `@erebos/pss` for consistency with the `bzz`-related packages.
- In the `@erebos/timeline` package, the `decode` option has been removed from `TimelineReaderConfig` and the `encode` option from `TimelineWriterConfig`, instead the `read()` and `write()` methods could be overwritten to cover the use case.
- The `createHex()` function has been removed from `@erebos/hex`, `Hex.from()` should be used instead.
- The `@erebos/feed-list` and `@erebos/timeline` packages classes now need to be injected a [`BzzFeed` instance](https://erebos.js.org/docs/bzz-feed#bzzfeed-class).

### Bzz packages changes

One goal for Erebos has been to stay quite low-level, at least for the core packages interacting with Swarm.
As the `bzz`-related packages have been growing over the past releases, it's been time to reconsider how to best organize them:

- Support for Swarm feeds requires additional dependencies such as `@erebos/hex`, `@erebos/keccak256` and `rxjs` that can be an additional burden for apps that don't need feeds, so all the feed-related methods have been extracted to the [`@erebos/bzz-feed` package](https://erebos.js.org/docs/bzz-feed).
- `@erebos/api-bzz-node` provided additional methods to interact with the file system. These methods are now provided by the dedicated [`@erebos/bzz-fs` package](https://erebos.js.org/docs/bzz-fs).
- The [`@erebos/bzz` package](https://erebos.js.org/docs/bzz) can now be used directly in browsers. However, it does not provide the `downloadDirectory()` and `uploadDirectory()` methods added in the `@erebos/bzz-browser` and `@erebos/bzz-node` packages.

So what package should you use?

- If you use node: `@erebos/bzz-node`
- Target a browser environment?
  - If you need to use the `downloadDirectory()` or `uploadDirectory()` method: `@erebos/bzz-browser`
  - Otherwise: `@erebos/bzz`
- Use React Native?
  - Try the experimental `@erebos/bzz-react-native`
  - Extend `@erebos/bzz` as needed
- For any other environment, try extending `@erebos/bzz`

If you need to interact with feeds, use [`@erebos/bzz-feed`](https://erebos.js.org/docs/bzz-feed).

If you want to interact with the file sytem when using node, the [`@erebos/bzz-fs` package](https://erebos.js.org/docs/bzz-fs) provides the utility methods previously implemented in `@erebos/api-bzz-node`.

### New package

The [`@erebos/doc-sync` package](https://erebos.js.org/docs/doc-sync) has been added, allowing to synchronize JSON documents.

## v0.12.0 (2019-12-17)

### Breaking change

The `Timeline` class has been split between the [`TimelineReader`](https://erebos.js.org/docs/timeline-api#timelinereader-class) and [`TimelineWriter`](https://erebos.js.org/docs/timeline-api#timelinewriter-class) classes. `TimelineWriter` extends `TimelineReader` and therefore can be used as a dropped-in replacement for `Timeline`.

### Additional features

- Support for [raw Swarm feeds](https://erebos.js.org/docs/api-bzz#raw-feeds-methods) has been added thanks to [Attila Gazso's pull request](https://github.com/MainframeHQ/erebos/pull/127).
- `@erebos/api-bzz-browser` can now be used in a Web Worker thanks to [Adam Uhlíř's pull request](https://github.com/MainframeHQ/erebos/pull/128).
- The [`uploadData()`](https://erebos.js.org/docs/api-bzz#uploaddata) and [`downloadData()`](https://erebos.js.org/docs/api-bzz#downloaddata) methods have been added to the [Bzz APIs](https://erebos.js.org/docs/api-bzz).
- The [`Hex.from()`](https://erebos.js.org/docs/hex#hexfrom) static method has been added as a replacement for `createHex()`.

### Other change

HTTP error messages from Swarm are now parsed when possible thanks to [Adam Uhlíř's pull request](https://github.com/MainframeHQ/erebos/pull/129).

### New package

The `@erebos/feed-list` package has been added, implementing [lists data structures](https://erebos.js.org/docs/feed-list) on top of raw Swarm feeds.

## v0.11.0 (2019-11-28)

This release adds support for [Readable streams](https://nodejs.org/api/stream.html#stream_class_stream_readable) in `@erebos/api-bzz-base`, thanks to [Adam Uhlíř's pull request](https://github.com/MainframeHQ/erebos/pull/116).

### Breaking change

The `uploadFileStream()` method of `@erebos/api-bzz-node` has been removed, `uploadFile()` now supporting streams.

### Additional features

- The [`downloadObservable()`](https://erebos.js.org/docs/api-bzz#downloadobservable) and [`downloadDirectoryData()`](https://erebos.js.org/docs/api-bzz#downloaddirectorydata) methods have been added to `@erebos/api-bzz-base` and are therefore also available in `@erebos/api-bzz-browser`. Until now they were only available in `@erebos/api-bzz-node`.
- The [`downloadStream()` method](https://erebos.js.org/docs/api-bzz#downloadstream) has been added.
- The [`uploadFile()`](https://erebos.js.org/docs/api-bzz#uploadfile) and [`upload()`](https://erebos.js.org/docs/api-bzz#upload) methods now support a [Readable stream](https://nodejs.org/api/stream.html#stream_class_stream_readable) input.

### Other change

The code base and type definitions have been updated to TypeScript 3.7 thanks to [Adam Uhlíř's pull request](https://github.com/MainframeHQ/erebos/pull/122).

## v0.10.0 (2019-10-01)

### Breaking changes

- The [`PollOptions` interface of the Bzz API](https://erebos.js.org/docs/api-bzz#polloptions) has been changed and is now used by the [Timeline API](https://erebos.js.org/docs/timeline-api). The [`PollFeedOptions` interface](https://erebos.js.org/docs/api-bzz#pollfeedoptions) is now used for polling feeds.
- The `PollOptions` interface of the Timeline API has been removed, now using the interface exported by the Bzz API.

### Swarm v0.5 support

Erebos v0.10 adds support for 2 new features added to the [Swarm v0.5 release](https://www.reddit.com/r/ethswarm/comments/dbqcbv/swarm_v050_is_released/):

#### [Pinning content](https://swarm-guide.readthedocs.io/en/latest/dapp_developer/index.html#pinning-content)

- Using the [`pin()`](https://erebos.js.org/docs/api-bzz#pin), [`unpin()`](https://erebos.js.org/docs/api-bzz#unpin) and [`pins()`](https://erebos.js.org/docs/api-bzz#pins) methods of the [Bzz class](https://erebos.js.org/docs/api-bzz#bzz-class).
- Using the [`pin` option](https://erebos.js.org/docs/api-bzz#uploadoptions) when uploading content.
- Using the [CLI](cli.md#pin-commands).

#### [Tags](https://swarm-guide.readthedocs.io/en/latest/dapp_developer/index.html#tags)

It is possible to track progress of chunks spreading over the network using the [`getTag()`](https://erebos.js.org/docs/api-bzz#gettag) and [`pins()`](https://erebos.js.org/docs/api-bzz#polltag) methods of the [Bzz class](https://erebos.js.org/docs/api-bzz#bzz-class).

### New packages

RPC utility libraries that were previously stored in a different repository have now been moved to the Erebos repository and npm organization.

You can learn more about these tools in the [added documentation](https://erebos.js.org/docs/rpc-intro).

## v0.9.0 (2019-08-12)

### Breaking changes

#### TypeScript rewrite

The main change in this release is the code base being rewritten in TypeScript. As part of these changes, the library no longer uses ES modules `default` exports but only named exports, such as:

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
- The experimental `@erebos/api-bzz-react-native` has been added by [Mark Vujevits](https://github.com/vujevits) in [PR #98](https://github.com/MainframeHQ/erebos/pull/98).

### Other changes

- The `sign()` and `verify()` functions exported by the `@erebos/secp256k1` package now accept a `BNInput` input value as exported by the `elliptic` package.
- The `addChapter()` method of the `Timeline` class now calls `createChapter()`, so default values for the chapter will be injected.
- Fixed links to Swarm install & run (by [thecryptofruit](https://github.com/thecryptofruit) in [PR #108](https://github.com/MainframeHQ/erebos/pull/108)).
- Docs have been updated to expose TypeScript interfaces rather than Flow types.

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
