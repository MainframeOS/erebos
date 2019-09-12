---
title: Bzz API
---

## Installation

### For browser

```sh
npm install @erebos/api-bzz-browser
```

### For Node

```sh
npm install @erebos/api-bzz-node
```

## Usage

```javacript
import { Bzz } from '@erebos/api-bzz-browser' // browser
// or
import { Bzz } from '@erebos/api-bzz-node' // node

const bzz = new Bzz({ url: 'http://localhost:8500' })
```

## Interfaces and types

### hexInput

Input value supported by the `Hex` class exported by the [`@erebos/hex` package](hex.md).

### hexValue

Hexadecimal-encoded string prefixed with `0x`. This type is exported by the [`@erebos/hex` package](hex.md).

### DirectoryEntry

```typescript
interface DirectoryEntry {
  data: string | Buffer
  contentType?: string
  size?: number
}
```

### DirectoryData

```typescript
type DirectoryData = Record<string, DirectoryEntry>
```

### FileEntry

```typescript
interface FileEntry {
  data: string | Buffer
  path: string
  size?: number
}
```

### ListEntry

```typescript
interface ListEntry {
  hash: string
  path: string
  contentType: string
  size: number
  mod_time: string
}
```

### ListResult

```typescript
interface ListResult {
  common_prefixes?: Array<string>
  entries?: Array<ListEntry>
}
```

### FeedTopicParams

```typescript
interface FeedTopicParams {
  name?: string
  topic?: string
}
```

### FeedMetadata

```typescript
interface FeedMetadata {
  feed: {
    topic: hexValue
    user: hexValue
  }
  epoch: {
    time: number
    level: number
  }
  protocolVersion: number
}
```

### FetchOptions

Common options to all HTTP requests. The `timeout` value can be set to `0` to prevent applying any timeout, for example if a default timeout is set at the instance level, but a particular request needs to ignore it.

```typescript
interface FetchOptions {
  headers?: Record<string, any>
  timeout?: number
}
```

### FileOptions

Extends [FetchOptions](#fetchoptions)

```typescript
interface FileOptions extends FetchOptions {
  contentType?: string
  path?: string
}
```

### BzzMode

```typescript
type BzzMode = 'default' | 'immutable' | 'raw'
```

### DownloadOptions

Extends [FileOptions](#fileoptions)

```typescript
interface DownloadOptions extends FileOptions {
  mode?: BzzMode
}
```

### UploadOptions

Extends [FileOptions](#fileoptions)

```typescript
interface UploadOptions extends FileOptions {
  defaultPath?: string
  encrypt?: boolean
  manifestHash?: hexValue | string
  size?: number
}
```

### PollOptions

Extends [FetchOptions](#fetchoptions)

```typescript
interface PollOptions extends FetchOptions {
  interval: number // in milliseconds
  immediate?: boolean // defaults to true
  whenEmpty?: 'accept' | 'ignore' | 'error' // defaults to 'accept'
  trigger?: Observable<void>
}
```

### PollContentHashOptions

Extends [PollOptions](#polloptions)

```typescript
interface PollContentHashOptions extends PollOptions {
  changedOnly?: boolean
}
```

### PollContentOptions

Extends [DownloadOptions](#downloadoptions) and [PollContentHashOptions](#pollcontenthashoptions)

```typescript
interface PollContentOptions extends DownloadOptions, PollContentHashOptions {}
```

### PinOptions

Extends [FetchOptions](#fetchoptions)

```typescript
interface PinOptions extends FetchOptions {
  download?: boolean
  raw?: boolean
}
```

### PinnedFile

```typescript
interface PinnedFile {
  hash: string
  pinCounter: number
  raw: boolean
  size: number
}
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

### BzzConfig

```typescript
interface BzzConfig {
  signBytes?: SignBytesFunc
  timeout?: number
  url: string
}
```

## Public API

### createFeedDigest()

**Arguments**

1.  [`meta: FeedMetadata`](#feedmetadat)
1.  [`data: hexInput`](#hexinput)

**Returns** `Array<number>`

### getFeedTopic()

**Arguments**

1.  [`params?: FeedTopicParams = {}`](#feedtopicparams)

**Returns** [`hexValue`](#hexvalue)

### HTTPError class

**Arguments**

1.  `status: number`: HTTP status code
1.  `message: string`: error message

**Properties**

- `status: number`: HTTP status code
- `message: string`: error message

### Bzz class

_Exported as `BzzBrowser` by `@erebos/api-bzz-browser` and `BzzNode` by `@erebos/api-bzz-node`._

**Arguments**

1.  [`config: BzzConfig`](#bzzconfig), see below

**Configuration**

- `url: string`: address of the Swarm HTTP gateway
- [`signBytes?: SignBytesFunc`](#signbytesfunc): needed in order to use feed updates APIs
- `timeout?: number`: default timeout to apply to all requests

### .getDownloadURL()

Returns the Swarm download URL for a given resource based on the provided arguments.

**Arguments**

1.  `hashOrDomain: string`: ENS name or Swarm hash
1.  [`options?: DownloadOptions = {}`](#downloadoptions): optional object providing the `path`.
1.  `raw?: boolean`

**Returns** `string`

### .getUploadURL()

Returns the Swarm upload URL for a given resource based on the provided arguments.

**Arguments**

1.  [`options?: UploadOptions = {}`](#uploadoptions)
1.  `raw?: boolean`

**Returns** `string`

### .getFeedURL()

Returns the Swarm URL for a feed based on the provided arguments.

**Arguments**

1.  `hashOrParams: string | FeedParams | FeedUpdateParams`: ENS name, hash of the feed manifest, [feed parameters](#feedparams) or [feed update parameters](#feedupdateparams)
1.  `flag?: 'meta'`

**Returns** `string`

### .hash()

Returns the hash of the provided `domain`.

**Arguments**

1.  `domain: string`
1.  [`options?: FetchOptions = {}`](#fetchoptions)

**Returns** `Promise<string>`

### .list()

Returns the manifest data for the provided `hashOrDomain` and optional `path`.

**Arguments**

1.  `hashOrDomain: string`: ENS name or Swarm hash
1.  [`options?: DownloadOptions = {}`](#downloadoptions): optional object providing the `path`.

**Returns** `Promise<ListResult>`

### .download()

The `download()` method returns a [`Response` instance](https://developer.mozilla.org/en-US/docs/Web/API/Response) if the request succeeds, or throws a `HTTPError`.

**Arguments**

1.  `hashOrDomain: string`: ENS name or Swarm hash
1.  [`options?: DownloadOptions = {}`](#downloadoptions) optional object providing the `path`, `mode` and `contentType`.

**Returns** `Promise<Response>`

### .uploadFile()

Uploads a single file and returns the hash. If the `contentType` option is provided, it will return the manifest hash, otherwise the file will be uploaded as raw data and will return the hash of the data itself.

**Arguments**

1.  `data: string | Buffer`
1.  [`options: UploadOptions = {}`](#uploadoptions)

**Returns** `Promise<string>`

### .uploadDirectory()

Uploads multiple files and returns the hash of the manifest containing these files.

By setting the `defaultPath` option, a file can be defined as the default one when resolving a manifest root, for example a static website could be uploaded with the `index.html` default path so that accessing `bzz://domain.eth` would resolve to `bzz://domain.eth/index.html`.

**Arguments**

1.  [`data: DirectoryData`](#directorydata)
1.  [`options: UploadOptions = {}`](#uploadoptions)

**Returns** `Promise<string>`

### .upload()

Calls [`uploadFile()`](#uploadfile) or [`uploadDirectory()`](#uploaddirectory) based on the provided `data` type.

**Arguments**

1.  `data: string | Buffer | DirectoryData`: providing a [`DirectoryData`](#directorydata) object uses [`uploadDirectory()`](#uploaddirectory), otherwise [`uploadFile()`](#uploadfile) is used
1.  [`options: UploadOptions = {}`](#uploadoptions)

**Returns** `Promise<string>`

### .deleteResource()

Deletes the resource with at the provided `path` in the manifest and returns the hash of the new manifest without this resource.

**Arguments**

1.  `hashOrDomain: string`: ENS name or Swarm hash
1.  `path: string`
1.  [`options?: FetchOptions = {}`](#fetchoptions)

**Returns** `Promise<string>`

### .createFeedManifest()

**Arguments**

1.  [`params: FeedParams`](#feedparams)
1.  [`options?: UploadOptions = {}`](#uploadoptions)

**Returns** `Promise<hexValue>`

### .getFeedMetadata()

**Arguments**

1.  `hashOrParams: string | FeedParams`: hash of the feed manifest or [feed parameters](#feedparams)
1.  [`options?: FetchOptions = {}`](#fetchoptions)

**Returns** `Promise<FeedMetadata>`

### .getFeedChunk()

**Arguments**

1.  `hashOrParams: string | FeedParams`: : ENS name, hash of the feed manifest or [feed parameters](#feedparams)
1.  [`options?: FetchOptions = {}`](#fetchoptions)

**Returns** `Promise<Response>`

### .getFeedContentHash()

Returns the feed contents hash.

**Arguments**

1.  `hashOrParams: string | FeedParams`: : ENS name, hash of the feed manifest or [feed parameters](#feedparams)
1.  [`options?: FetchOptions = {}`](#fetchoptions)

**Returns** `Promise<string>`

### .getFeedContent()

Returns the feed contents `Response`.

**Arguments**

1.  `hashOrParams: string | FeedParams`: : ENS name, hash of the feed manifest or [feed parameters](#feedparams)
1.  [`options?: DownloadOptions = {}`](#downloadoptions)

**Returns** `Promise<Response>`

### .pollFeedChunk()

Returns a [RxJS `Observable`](https://rxjs.dev/api/index/class/Observable) emitting the `Response` objects or `null` depending on the `options`.

**Arguments**

1.  `hashOrParams: string | FeedParams`: ENS name, hash of the feed manifest or [feed parameters](#feedparams)
1.  [`options: PollOptions`](#polloptions), see below

**Options**

- `interval: number`: the number of milliseconds between each query
- `immediate?: boolean`: by default, a query will be performed as soon as the returned `Observable` is subscribed to. Set this option to `false` in order to wait for the first `interval` tick to perform the first query.
- `whenEmpty?: 'accept' | 'ignore' | 'error'`: behaviour to apply when the feed response is an HTTP 404 status: `accept` (default) will push a `null` value to the subscriber, `ignore` will not push any empty value, and `error` will push the error response to the subscriber, causing it to error
- `trigger?: Observable<void>`: provides an external `Observable` that can be used to execute queries

**Returns** `Observable<Response | null>`

### .pollFeedContentHash()

Returns a [RxJS `Observable`](https://rxjs.dev/api/index/class/Observable) emitting the contents hash or `null` depending on the `options`.

**Arguments**

1.  `hashOrParams: string | FeedParams`: ENS name, hash of the feed manifest or [feed parameters](#feedparams)
1.  [`options: PollContentHashOptions`](#pollcontenthashoptions), see below

**Options**

- All the options of [`pollFeedChunk()`](#pollfeedchunk).
- `changedOnly?: boolean`: set it to `true` in order to only push when the content has changed rather than on every interval tick

### .pollFeedContent()

Returns a [RxJS `Observable`](https://rxjs.dev/api/index/class/Observable) emitting the contents `Response` objects or `null` depending on the `options`.

**Arguments**

1.  `hashOrParams: string | FeedParams`: ENS name, hash of the feed manifest or [feed parameters](#feedparams)
1.  [`options: PollContentOptions`](#pollcontentoptions): includes all the options of [`pollFeedContentHash()`](#pollfeedcontenthash) as well as [`DownloadOptions`](#downloadoptions).

**Returns** `Observable<Response | null>`

### .postSignedFeedChunk()

**Arguments**

1.  [`params: FeedUpdateParams`](#feedupdateparams)
1.  `body: Buffer`
1.  [`options?: FetchOptions = {}`](#fetchoptions)

**Returns** `Promise<Response>`

### .postFeedChunk()

**Arguments**

1.  [`meta: FeedMetadata`](#feedmetadata)
1.  `data: string | Object | Buffer`
1.  [`options?: FetchOptions = {}`](#fetchoptions)
1.  `signParams?: any`

**Returns** `Promise<Response>`

### .setFeedChunk()

**Arguments**

1.  `hashOrParams: string | FeedParams`: ENS name, hash of the feed manifest or [feed parameters](#feedparams)
1.  `data: string | Record<string, any> | Buffer`
1.  [`options?: FetchOptions = {}`](#fetchoptions)
1.  `signParams?: any`

**Returns** `Promise<Response>`

### .setFeedContentHash()

**Arguments**

1.  `hashOrParams: string | FeedParams`: ENS name, hash of the feed manifest or [feed parameters](#feedparams)
1.  `contentHash: string`
1.  [`options?: FetchOptions = {}`](#fetchoptions)
1.  `signParams?: any`

**Returns** `Promise<Response>`

### .setFeedContent()

This method implements the flow of uploading the provided `data` and updating the feed identified by the provided `userOrHash` and eventually `feedParams` with the immutable hash of the uploaded contents, and returns this hash.

**Arguments**

1.  `hashOrParams: string | FeedParams`: ENS name, hash of the feed manifest or [feed parameters](#feedparams)
1.  `data: string | Object | Buffer`
1.  [`options?: UploadOptions = {}`](#uploadoptions)
1.  `signParams?: any`

**Returns** `Promise<string>`

### .pin()

Pins the specified resource. To make sure the resource is available on the node, the `download` option can be set to explicitely download it before pinning.

**Arguments**

1.  `hashOrDomain: string`: ENS name or Swarm hash
1.  [`options?: PinOptions = {}`](#pinoptions)

**Returns** `Promise<void>`

### .unpin()

**Arguments**

1.  `hashOrDomain: string`: ENS name or Swarm hash
1.  [`options?: FetchOptions = {}`](#fetchoptions)

**Returns** `Promise<void>`

### .pins()

Returns the list of resources currently pinned on the node.

**Arguments**

1.  [`options?: FetchOptions = {}`](#fetchoptions)

**Returns** `Promise<Array<PinnedFile>>` the list of [`PinnedFile`](#pinnedfile)

## Node-specific APIs

_The following `Bzz` class methods are only available when using `@erebos/api-bzz-node`._

### .download\$()

Returns a [RxJS `Observable`](https://rxjs.dev/api/index/class/Observable) emitting the [`FileEntry`](#fileentry) objects as they are downloaded.

**Arguments**

1.  `hashOrDomain: string`: ENS name or Swarm hash
1.  [`options?: DownloadOptions = {}`](#downloadoptions)

**Returns** `Observable<FileEntry>`

### .downloadDirectoryData()

**Arguments**

1.  `hashOrDomain: string`: ENS name or Swarm hash
1.  [`options?: DownloadOptions = {}`](#downloadoptions)

**Returns** `Promise<DirectoryData>`

### .downloadTarTo()

**Arguments**

1.  `hashOrDomain: string`: ENS name or Swarm hash
1.  `path: string`: tar file path
1.  [`options?: DownloadOptions = {}`](#downloadoptions)

**Returns** `Promise<void>`

### .downloadFileTo()

**Arguments**

1.  `hashOrDomain: string`: ENS name or Swarm hash
1.  `path: string`
1.  [`options?: DownloadOptions = {}`](#downloadoptions)

**Returns** `Promise<void>`

### .downloadDirectoryTo()

**Arguments**

1.  `hashOrDomain: string`: ENS name or Swarm hash
1.  `path: string`
1.  [`options?: DownloadOptions = {}`](#downloadoptions)

**Returns** `Promise<number>` the number of files written.

### .downloadTo()

Call `downloadFileTo()` or `downloadDirectoryTo()` depending on the provided `path`.

**Arguments**

1.  `hashOrDomain: string`: ENS name or Swarm hash
1.  `path: string`
1.  [`options?: DownloadOptions = {}`](#downloadoptions)

**Returns** `Promise<void>`

### .uploadFileStream()

**Arguments**

1.  `stream: Readable`: Node.js [`Readable stream`](https://nodejs.org/dist/latest-v10.x/docs/api/stream.html#stream_class_stream_readable) instance
1.  [`options?: UploadOptions = {}`](#uploadoptions)

**Returns** `Promise<string>`

### .uploadTar()

**Arguments**

1.  `path: string`: path to an existing tar archive or a directory to pack
1.  [`options?: UploadOptions = {}`](#uploadoptions)

**Returns** `Promise<string>`

### .uploadFileFrom()

**Arguments**

1.  `path: string`: file to upload
1.  [`options?: UploadOptions = {}`](#uploadoptions)

**Returns** `Promise<string>`

### .uploadDirectoryFrom()

**Arguments**

1.  `path: string`: directory to upload
1.  [`options?: UploadOptions = {}`](#uploadoptions)

**Returns** `Promise<string>`

### .uploadFrom()

Calls `uploadFileFrom()` or `uploadDirectoryFrom()` depending on the provided `path`.

**Arguments**

1.  `path: string`: file or directory to upload
1.  [`options?: UploadOptions = {}`](#uploadoptions)

**Returns** `Promise<string>`
