---
title: Bzz Feed API
---

## Installation

```sh
npm install @erebos/bzz-feed
```

> The BzzFeed class must be injected a [`Bzz` instance](bzz.md), so `@erebos/bzz` or a package extending it must also be installed alongside.

## Usage

```javacript
import { Bzz } from '@erebos/bzz'
import { BzzFeed } from '@erebos/bzz-feed'

const bzz = new Bzz({ url: 'http://localhost:8500' })
const bzzFeed = new BzzFeed({ bzz })
```

## Interfaces and types

### Feed

```typescript
interface Feed {
  topic: string
  user: string
}
```

### FeedEpoch

```typescript
interface FeedEpoch {
  time: number
  level: number
}
```

### FeedMetadata

Uses [`Feed`](#feed) and [`FeedEpoch`](#feedepoch) interfaces

```typescript
interface FeedMetadata {
  feed: Feed
  epoch: FeedEpoch
  protocolVersion: number
}
```

### FeedTopicParams

```typescript
interface FeedTopicParams {
  name?: string
  topic?: string
}
```

### PollFeedOptions

Extends [PollOptions](bzz.md#polloptions)

```typescript
interface PollFeedOptions extends PollOptions {
  whenEmpty?: 'accept' | 'ignore' | 'error' // defaults to 'accept'
  trigger?: Observable<void>
}
```

### PollFeedContentHashOptions

Extends [PollFeedOptions](#pollfeedoptions)

```typescript
interface PollFeedContentHashOptions extends PollFeedOptions {
  changedOnly?: boolean
}
```

### PollFeedContentOptions

Extends [DownloadOptions](bzz.md#downloadoptions) and [PollFeedContentHashOptions](#pollfeedcontenthashoptions)

```typescript
interface PollFeedContentOptions
  extends DownloadOptions,
    PollFeedContentHashOptions {}
```

### FeedParams

```typescript
interface FeedParams {
  user: string
  level?: number
  name?: string
  time?: number
  topic?: string
}
```

### FeedUpdateParams

```typescript
interface FeedUpdateParams {
  user: string
  level: number
  time: number
  topic: string
  signature: string
}
```

### SignBytesFunc

Function to provide in order to sign feed updates

```typescript
type SignBytesFunc = (
  digest: Array<number>,
  params?: any,
) => Promise<Array<number>>
```

### BzzFeedConfig

```typescript
interface BzzFeedConfig {
  bzz: Bzz
  signBytes?: SignBytesFunc
}
```

## Constants

- `FEED_MAX_DATA_LENGTH: number`: the max byte length a feed chunk data be (4KB minus headers and signature)
- `FEED_ZERO_TOPIC: hexValue`: empty feed topic (zero-filled)

## API

### createFeedDigest()

**Arguments**

1.  [`meta: FeedMetadata`](#feedmetadata)
1.  [`data: hexInput`](hex.md#hexinput)

**Returns** `Array<number>`

### feedMetaToBuffer()

**Arguments**

1.  [`meta: FeedMetadata`](#feedmetadata)

**Returns** [`Buffer`](https://nodejs.org/api/buffer.html#buffer_class_buffer)

### feedMetaToHash()

**Arguments**

1.  [`meta: FeedMetadata`](#feedmetadata)

**Returns** `string`

### getFeedTopic()

**Arguments**

1.  [`params?: FeedTopicParams = {}`](#feedtopicparams)

**Returns** [`hexValue`](hex.md#hexvalue)

### getFeedMetadata()

**Arguments**

1.  `input: FeedID | FeedMetadata | FeedParams`

**Returns** [`FeedMetadata interface`](#feedmetadata) (Object or [`FeedID` instance](#feedid-class))

## FeedID class

Implements the [`FeedParams`](#feedparams) and [`FeedMetadata`](#feedmetadata) interfaces.

### new FeedID()

**Arguments**

1.  [`params: FeedParams`](#feedparams)

### FeedID.from()

Creates a new `FeedID` from a [`Buffer`](https://nodejs.org/api/buffer.html#buffer_class_buffer) instance, an existing `FeedID` instance or an Object implementing the [`FeedMetadata`](#feedmetadata) or [`FeedParams`](#feedparams) interface.

**Arguments**

1.  `input: Buffer | FeedID | FeedMetadata | FeedParams`

**Returns** `FeedID`

### FeedID.fromBuffer()

**Arguments**

1.  `buffer: Buffer`: a [`Buffer`](https://nodejs.org/api/buffer.html#buffer_class_buffer) instance

**Returns** `FeedID`

### FeedID.fromMetadata()

**Arguments**

1.  [`meta: FeedMetadata`](#feedmetadata)

**Returns** `FeedID`

### .user

**Returns** `string`

### .topic

**Returns** `string`

### .time

**Returns** `number`

### .level

**Returns** `number`

### .protocolVersion

**Returns** `number`

### .feed

**Returns** [`Feed`](#feed)

### .epoch

**Returns** [`FeedEpoch`](#feedepoch)

### .clone()

**Returns** `FeedID`

### .toBuffer()

**Returns** [`Buffer`](https://nodejs.org/api/buffer.html#buffer_class_buffer)

### .toHash()

**Returns** `string`

## BzzFeed class

### new BzzFeed()

**Arguments**

1.  [`config: BzzFeedConfig`](#bzzfeedconfig), see below

**Configuration**

- [`bzz: Bzz`](bzz.md#bzz-class): Bzz instance
- [`signBytes?: SignBytesFunc`](#signbytesfunc): needed in order to use feed updates APIs

### .getURL()

Returns the Swarm URL for a feed based on the provided arguments.

**Arguments**

1.  `hashOrParams: string | FeedParams | FeedUpdateParams`: ENS name, hash of the feed manifest, [feed parameters](#feedparams) or [feed update parameters](#feedupdateparams)
1.  `flag?: 'meta'`

**Returns** `string`

### .createManifest()

**Arguments**

1.  [`params: FeedParams`](#feedparams)
1.  [`options?: UploadOptions = {}`](bzz.md#uploadoptions)

**Returns** `Promise<string>`

### .getMetadata()

**Arguments**

1.  `hashOrParams: string | FeedParams`: hash of the feed manifest or [feed parameters](#feedparams)
1.  [`options?: FetchOptions = {}`](bzz.md#fetchoptions)

**Returns** `Promise<FeedMetadata>`

### .getChunk()

**Arguments**

1.  `hashOrParams: string | FeedParams`: : ENS name, hash of the feed manifest or [feed parameters](#feedparams)
1.  [`options?: FetchOptions = {}`](bzz.md#fetchoptions)

**Returns** `Promise<Response>`

### .getContentHash()

Returns the feed contents hash.

**Arguments**

1.  `hashOrParams: string | FeedParams`: : ENS name, hash of the feed manifest or [feed parameters](#feedparams)
1.  [`options?: FetchOptions = {}`](bzz.md#fetchoptions)

**Returns** `Promise<string>`

### .getContent()

Returns the feed contents `Response`.

**Arguments**

1.  `hashOrParams: string | FeedParams`: : ENS name, hash of the feed manifest or [feed parameters](#feedparams)
1.  [`options?: DownloadOptions = {}`](bzz.md#downloadoptions)

**Returns** `Promise<Response>`

### .pollChunk()

Returns a [RxJS `Observable`](https://rxjs.dev/api/index/class/Observable) emitting the `Response` objects or `null` depending on the `options`.

**Arguments**

1.  `hashOrParams: string | FeedParams`: ENS name, hash of the feed manifest or [feed parameters](#feedparams)
1.  [`options: PollFeedOptions`](bzz.md#pollfeedoptions), see below

**Options**

- `interval: number`: the number of milliseconds between each query
- `immediate?: boolean`: by default, a query will be performed as soon as the returned `Observable` is subscribed to. Set this option to `false` in order to wait for the first `interval` tick to perform the first query.
- `whenEmpty?: 'accept' | 'ignore' | 'error'`: behaviour to apply when the feed response is an HTTP 404 status: `accept` (default) will push a `null` value to the subscriber, `ignore` will not push any empty value, and `error` will push the error response to the subscriber, causing it to error
- `trigger?: Observable<void>`: provides an external `Observable` that can be used to execute queries

**Returns** `Observable<Response | null>`

### .pollContentHash()

Returns a [RxJS `Observable`](https://rxjs.dev/api/index/class/Observable) emitting the contents hash or `null` depending on the `options`.

**Arguments**

1.  `hashOrParams: string | FeedParams`: ENS name, hash of the feed manifest or [feed parameters](#feedparams)
1.  [`options: PollContentHashOptions`](#pollcontenthashoptions), see below

**Options**

- All the options of [`pollFeedChunk()`](#pollfeedchunk).
- `changedOnly?: boolean`: set it to `true` in order to only push when the content has changed rather than on every interval tick

### .pollContent()

Returns a [RxJS `Observable`](https://rxjs.dev/api/index/class/Observable) emitting the contents `Response` objects or `null` depending on the `options`.

**Arguments**

1.  `hashOrParams: string | FeedParams`: ENS name, hash of the feed manifest or [feed parameters](#feedparams)
1.  [`options: PollContentOptions`](#pollcontentoptions): includes all the options of [`pollFeedContentHash()`](#pollfeedcontenthash) as well as [`DownloadOptions`](bzz.md#downloadoptions).

**Returns** `Observable<Response | null>`

### .postSignedChunk()

**Arguments**

1.  [`params: FeedUpdateParams`](#feedupdateparams)
1.  `body: Buffer`
1.  [`options?: FetchOptions = {}`](bzz.md#fetchoptions)

**Returns** `Promise<Response>`

### .postChunk()

**Arguments**

1.  [`meta: FeedMetadata`](#feedmetadata)
1.  `data: string | Record<string, any> | Buffer`
1.  [`options?: FetchOptions = {}`](bzz.md#fetchoptions)
1.  `signParams?: any`

**Returns** `Promise<Response>`

### .setChunk()

**Arguments**

1.  `hashOrParams: string | FeedParams`: ENS name, hash of the feed manifest or [feed parameters](#feedparams)
1.  `data: string | Record<string, any> | Buffer`
1.  [`options?: FetchOptions = {}`](bzz.md#fetchoptions)
1.  `signParams?: any`

**Returns** `Promise<Response>`

### .setContentHash()

**Arguments**

1.  `hashOrParams: string | FeedParams`: ENS name, hash of the feed manifest or [feed parameters](#feedparams)
1.  `contentHash: string`
1.  [`options?: FetchOptions = {}`](bzz.md#fetchoptions)
1.  `signParams?: any`

**Returns** `Promise<Response>`

### .setContent()

This method implements the flow of uploading the provided `data` and updating the feed identified by the provided `userOrHash` and eventually `feedParams` with the immutable hash of the uploaded contents, and returns this hash.

**Arguments**

1.  `hashOrParams: string | FeedParams`: ENS name, hash of the feed manifest or [feed parameters](#feedparams)
1.  `data: string | Record<string, any> | Buffer`
1.  [`options?: UploadOptions = {}`](bzz.md#uploadoptions)
1.  `signParams?: any`

**Returns** `Promise<string>`

## Raw feeds methods

Raw feeds can be used to skip Swarm's built-in feed lookup mechanism and use the underlying resource interface directly. Internally Swarm uses a separate address space for `bzz-feed`s and they can be addressed with `FeedParams`. When uploading content, a node calculates the hash from the `FeedParams` and stores the content so that it can be acccessed with that hash.

As with the normal feed API we can only store one chunk worth of data (4KB) in a feed chunk, so the best practice is to store a content hash in the feed chunk. Sometimes it can be useful to work directly with the content hashes and sometimes we just need the content. Hence we have two versions of each function when downloading or uploading the data.

### .getRawContentHash()

This method downloads the hash that can be found on the address specified by the `FeedParams`.

**Arguments**

1.  `params: FeedParams` [feed parameters](#feedparams)
1.  [`options?: FetchOptions = {}`](bzz.md#fetchoptions)

**Returns** `Promise<string>`

### .getRawContent()

This method downloads the contents of the hash that can be found on the address specified by the `FeedParams`.

**Arguments**

1.  `params: FeedParams` [feed parameters](#feedparams)
1.  [`options?: DownloadOptions = {}`](bzz.md#downloadoptions)

**Returns** `Promise<Response>`

### .setRawContentHash()

This method uploads a hash to the raw feed that can be found on the address specified by the `FeedParams`.

**Arguments**

1.  `params: FeedParams` [feed parameters](#feedparams)
1.  `contentHash: string`
1.  [`options?: UploadOptions = {}`](bzz.md#uploadoptions)
1.  `signParams?: any`

**Returns** `Promise<Response>`

### .setRawContent()

This method implements the flow of uploading the provided `data` and updating the raw feed identified by the provided `FeedParams` with the immutable hash of the uploaded contents, and returns this hash.

**Arguments**

1.  `params: FeedParams` [feed parameters](#feedparams)
1.  `data: string | Buffer | DirectoryData`
1.  [`options?: UploadOptions = {}`](bzz.md#uploadoptions)
1.  `signParams?: any`

**Returns** `Promise<string>`
