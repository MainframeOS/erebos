---
title: Bzz API
---

## Standalone usage

```javascript
import Bzz from '@erebos/api-bzz-browser' // browser
// or
import Bzz from '@erebos/api-bzz-node' // node

const bzz = new Bzz('http://localhost:8500')
```

## Flow types

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

## Public API

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

### .hash()

Returns the hash of the provided `domain`.

**Arguments**

1.  `domain: string`

**Returns** `Promise<string>`

### .list()

Returns the manifest data for the provided `hashOrDomain` and optional `path`.

**Arguments**

1.  `hashOrDomain: string`
1.  `options?: DownloadOptions`: optional object providing the `path`.

**Returns** `Promise<ListResult>`

### .download()

The `download()` method returns a [`Response` instance](https://developer.mozilla.org/en-US/docs/Web/API/Response) if the request succeeds, or throws a `HTTPError`.

**Arguments**

1.  `hashOrDomain: string`
1.  `options?: DownloadOptions` optional object providing the `path`, `mode` and `contentType`.

**Returns** `Promise<Response>`

### .uploadFile()

Uploads a single file and returns the hash. If the `contentType` option is provided, it will return the manifest hash, otherwise the file will be uploaded as raw data and will return the hash of the data itself.

**Arguments**

1.  `data: string | Buffer`
1.  `options?: UploadOptions`

**Returns** `Promise<string>`

### .uploadDirectory()

Uploads multiple files and returns the hash of the manifest containing these files.

By setting the `defaultPath` option, a file can be defined as the default one when resolving a manifest root, for example a static website could be uploaded with the `index.html` default path so that accessing `bzz://domain.eth` would resolve to `bzz://domain.eth/index.html`.

**Arguments**

1.  `data: DirectoryData`
1.  `options?: UploadOptions`

**Returns** `Promise<string>`

### .upload()

Calls `uploadFile()` or `uploadDirectory()` based on the provided `data` type.

**Arguments**

1.  `data: string | Buffer | DirectoryData`
1.  `options?: UploadOptions`

**Returns** `Promise<string>`

### .deleteResource()

Deletes the resource with at the provided `path` in the manifest and returns the hash of the new manifest without this resource.

**Arguments**

1.  `hashOrDomain: string`
1.  `path: string`

**Returns** `Promise<string>`

## Node-specific APIs

The following methods are only available when using `@erebos/api-bzz-node`.

### .dowloadObservable()

Returns a [RxJS `Observable`](https://rxjs-dev.firebaseapp.com/api/index/class/Observable) emitting the `FileEntry` objects as they are downloaded.

**Arguments**

1.  `hashOrDomain: string`
1.  `options?: DownloadOptions`

**Returns** `Observable<FileEntry>`

### .downloadDirectoryData()

**Arguments**

1.  `hashOrDomain: string`
1.  `options?: DownloadOptions`

**Returns** `Promise<DirectoryData>`

### .downloadFileTo()

**Arguments**

1.  `hashOrDomain: string`
1.  `path: string`
1.  `options?: DownloadOptions`

**Returns** `Promise<void>`

### .downloadDirectoryTo()

**Arguments**

1.  `hashOrDomain: string`
1.  `path: string`
1.  `options?: DownloadOptions`

**Returns** `Promise<number>` the number of files written.

### .downloadTo()

Call `downloadFileTo()` or `downloadDirectoryTo()` depending on the provided `path`.

**Arguments**

1.  `hashOrDomain: string`
1.  `path: string`
1.  `options?: DownloadOptions`

**Returns** `Promise<void>`

### .uploadTar()

**Arguments**

1.  `path: string`: path to an existing tar archive or a directory to pack.
1.  `options?: UploadOptions`

**Returns** `Promise<string>`

### .uploadFileFrom()

**Arguments**

1.  `path: string`: file to upload.
1.  `options?: UploadOptions`

**Returns** `Promise<string>`

### .uploadDirectoryFrom()

**Arguments**

1.  `path: string`: directory to upload.
1.  `options?: UploadOptions`

**Returns** `Promise<string>`

### .uploadFrom()

Calls `uploadFileFrom()` or `uploadDirectoryFrom()` depending on the provided `path`.

**Arguments**

1.  `path: string`: file or directory to upload.
1.  `options?: UploadOptions`

**Returns** `Promise<string>`
