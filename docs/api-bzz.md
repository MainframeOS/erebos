---
title: Bzz API
---

## Standalone usage

```javascript
import BzzAPI from '@erebos/api-bzz-browser' // browser
// or
import BzzAPI from '@erebos/api-bzz-node' // node

const bzz = new BzzAPI('http://localhost:8500')
```

## Flow types

### hexValue

Hexadecimal-encoded string prefixed with `0x`.

### KeyPair

Export from the `elliptic` library.

### DirectoryData

```javascript
type DirectoryData = {
  [path: string]: { data: string | Buffer, contentType: string, size?: number },
}
```

### FileEntry

```javascript
type FileEntry = {
  data: string | Buffer,
  path: string,
  size?: number,
}
```

### ListEntry

```javascript
type ListEntry = {
  hash: string,
  path: string,
  contentType: string,
  size: number,
  mod_time: string,
}
```

### ListResult

```javascript
type ListResult = {
  common_prefixes?: Array<string>,
  entries?: Array<ListEntry>,
}
```

### FeedMetadata

```javascript
type FeedMetadata = {
  feed: {
    topic: hexValue,
    user: hexValue,
  },
  epoch: {
    time: number,
    level: number,
  },
  protocolVersion: number,
}
```

### BzzMode

```javascript
type BzzMode = 'default' | 'immutable' | 'raw'
```

### SharedOptions

```javascript
type SharedOptions = {
  contentType?: string,
  path?: string,
}
```

### DownloadOptions

```javascript
type DownloadOptions = SharedOptions & {
  mode?: BzzMode,
}
```

### UploadOptions

```javascript
type UploadOptions = SharedOptions & {
  defaultPath?: string,
  encrypt?: boolean,
  manifestHash?: string,
}
```

### FeedOptions

```javascript
type FeedOptions = {
  level?: number,
  name?: string,
  time?: number,
  topic?: string,
}
```

## Public API

### createFeedDigest()

**Arguments**

1.  `meta: FeedMetadata`
1.  `data: string | Object | Buffer`

**Returns** `Buffer`

### createKeyPair()

Creates an elliptic `KeyPair` object using the `privateKey` if provided or generating a new one.

**Arguments**

1.  `privateKey?: ?string`
1.  `encoding?: string`

**Returns** `Buffer`

### getFeedTopic()

**Arguments**

1.  `options: FeedOptions`

**Returns** `hexValue`

### pubKeyToAddress()

**Arguments**

1.  `pubKey: Object`

**Returns** `hexValue`

### signFeedDigest()

**Arguments**

1.  `digest: Buffer`
1.  `privKey: Object`

**Returns** `hexValue`

### signFeedUpdate()

Combines `createFeedDigest()` and `signFeedDigest()`.

**Arguments**

1.  `meta: FeedMetadata`
1.  `data: string | Object | Buffer`
1.  `privKey: Object`

**Returns** `hexValue`

### HTTPError class

**Arguments**

1.  `status: number`: HTTP status code
1.  `message: string`: error message

**Properties**

- `status: number`: HTTP status code
- `message: string`: error message

### Bzz class (default export)

Creates a Bzz instance using the server provided as `url`.

**Arguments**

1.  `url: string`

### .getDownloadURL()

Returns the Swarm download URL for a given resource based on the provided arguments.

**Arguments**

1.  `hashOrDomain: string`
1.  `options?: DownloadOptions`: optional object providing the `path`.
1.  `raw?: boolean`

**Returns** `string`

### .getUploadURL()

Returns the Swarm upload URL for a given resource based on the provided arguments.

**Arguments**

1.  `options: UploadOptions`
1.  `raw?: boolean`

**Returns** `string`

### .getFeedURL()

Returns the Swarm URL for a feed based on the provided arguments.

**Arguments**

1.  `userOrHash: string`
1.  `options?: FeedOptions = {}`
1.  `flag?: 'meta'`

**Returns** `string`

### .hash()

Returns the hash of the provided `domain`.

**Arguments**

1.  `domain: string`
1.  `headers?: Object`: optional additional request headers.

**Returns** `Promise<string>`

### .list()

Returns the manifest data for the provided `hashOrDomain` and optional `path`.

**Arguments**

1.  `hashOrDomain: string`
1.  `options?: DownloadOptions`: optional object providing the `path`.
1.  `headers?: Object`: optional additional request headers.

**Returns** `Promise<ListResult>`

### .download()

The `download()` method returns a [`Response` instance](https://developer.mozilla.org/en-US/docs/Web/API/Response) if the request succeeds, or throws a `HTTPError`.

**Arguments**

1.  `hashOrDomain: string`
1.  `options?: DownloadOptions` optional object providing the `path`, `mode` and `contentType`.
1.  `headers?: Object`: optional additional request headers.

**Returns** `Promise<Response>`

### .uploadFile()

Uploads a single file and returns the hash. If the `contentType` option is provided, it will return the manifest hash, otherwise the file will be uploaded as raw data and will return the hash of the data itself.

**Arguments**

1.  `data: string | Buffer`
1.  `options?: UploadOptions`
1.  `headers?: Object`: optional additional request headers.

**Returns** `Promise<string>`

### .uploadDirectory()

Uploads multiple files and returns the hash of the manifest containing these files.

By setting the `defaultPath` option, a file can be defined as the default one when resolving a manifest root, for example a static website could be uploaded with the `index.html` default path so that accessing `bzz://domain.eth` would resolve to `bzz://domain.eth/index.html`.

**Arguments**

1.  `data: DirectoryData`
1.  `options?: UploadOptions`
1.  `headers?: Object`: optional additional request headers.

**Returns** `Promise<string>`

### .upload()

Calls `uploadFile()` or `uploadDirectory()` based on the provided `data` type.

**Arguments**

1.  `data: string | Buffer | DirectoryData`
1.  `options?: UploadOptions`
1.  `headers?: Object`: optional additional request headers.

**Returns** `Promise<string>`

### .deleteResource()

Deletes the resource with at the provided `path` in the manifest and returns the hash of the new manifest without this resource.

**Arguments**

1.  `hashOrDomain: string`
1.  `path: string`
1.  `headers?: Object`: optional additional request headers.

**Returns** `Promise<string>`

### .createFeedManifest()

**Arguments**

1.  `user: string`
1.  `options?: FeedOptions = {}`

**Returns** `Promise<hexValue>`

### .getFeedMetadata()

**Arguments**

1.  `user: string`
1.  `options?: FeedOptions = {}`

**Returns** `Promise<FeedMetadata>`

### .getFeedValue()

**Arguments**

1.  `user: string`
1.  `options?: FeedOptions = {}`

**Returns** `Promise<Response>`

### .postFeedValue()

**Arguments**

1.  `keyPair: KeyPair`
1.  `data: string | Object | Buffer`
1.  `options?: FeedOptions = {}`

**Returns** `Promise<Response>`

## Node-specific APIs

The following `Bzz` class methods are only available when using `@erebos/api-bzz-node`.

### .downloadObservable()

Returns a [RxJS `Observable`](https://rxjs-dev.firebaseapp.com/api/index/class/Observable) emitting the `FileEntry` objects as they are downloaded.

**Arguments**

1.  `hashOrDomain: string`
1.  `options?: DownloadOptions`
1.  `headers?: Object`: optional additional request headers.

**Returns** `Observable<FileEntry>`

### .downloadDirectoryData()

**Arguments**

1.  `hashOrDomain: string`
1.  `options?: DownloadOptions`
1.  `headers?: Object`: optional additional request headers.

**Returns** `Promise<DirectoryData>`

### .downloadFileTo()

**Arguments**

1.  `hashOrDomain: string`
1.  `path: string`
1.  `options?: DownloadOptions`
1.  `headers?: Object`: optional additional request headers.

**Returns** `Promise<void>`

### .downloadDirectoryTo()

**Arguments**

1.  `hashOrDomain: string`
1.  `path: string`
1.  `options?: DownloadOptions`
1.  `headers?: Object`: optional additional request headers.

**Returns** `Promise<number>` the number of files written.

### .downloadTo()

Call `downloadFileTo()` or `downloadDirectoryTo()` depending on the provided `path`.

**Arguments**

1.  `hashOrDomain: string`
1.  `path: string`
1.  `options?: DownloadOptions`
1.  `headers?: Object`: optional additional request headers.

**Returns** `Promise<void>`

### .uploadTar()

**Arguments**

1.  `path: string`: path to an existing tar archive or a directory to pack.
1.  `options?: UploadOptions`
1.  `headers?: Object`: optional additional request headers.

**Returns** `Promise<string>`

### .uploadFileFrom()

**Arguments**

1.  `path: string`: file to upload.
1.  `options?: UploadOptions`
1.  `headers?: Object`: optional additional request headers.

**Returns** `Promise<string>`

### .uploadDirectoryFrom()

**Arguments**

1.  `path: string`: directory to upload.
1.  `options?: UploadOptions`
1.  `headers?: Object`: optional additional request headers.

**Returns** `Promise<string>`

### .uploadFrom()

Calls `uploadFileFrom()` or `uploadDirectoryFrom()` depending on the provided `path`.

**Arguments**

1.  `path: string`: file or directory to upload.
1.  `options?: UploadOptions`
1.  `headers?: Object`: optional additional request headers.

**Returns** `Promise<string>`
