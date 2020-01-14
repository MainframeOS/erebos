---
title: Bzz API
---

## Installation

### Core package

> This package doesn't use third-party dependencies but does not support all the APIs provided by `@erebos/bzz-browser` and `@erebos/bzz-node`

```sh
npm install @erebos/bzz
```

### For browser

```sh
npm install @erebos/bzz-browser
```

### For Node

```sh
npm install @erebos/bzz-node
```

## Usage

```javacript
import { Bzz } from '@erebos/bzz' // core
// or
import { BzzBrowser as Bzz } from '@erebos/bzz-browser' // browser
// or
import { BzzNode as Bzz } from '@erebos/bzz-node' // node

const bzz = new Bzz({ url: 'http://localhost:8500' })
```

## Interfaces and types

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
  manifestHash?: string
  pin?: boolean
  size?: number
}
```

### PollOptions

Extends [FetchOptions](#fetchoptions)

```typescript
interface PollOptions extends FetchOptions {
  interval: number // in milliseconds
  immediate?: boolean // defaults to true
}
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
  address: string
  counter: number
  raw: boolean
  size: number
}
```

### Tag

```typescript
interface Tag {
  uid: number
  name: string
  address: string
  total: number
  split: number
  seen: number
  stored: number
  sent: number
  synced: number
  startedAt: Date
}
```

### BzzConfig

```typescript
interface BzzConfig {
  timeout?: number
  url: string
}
```

## HTTPError class

> This class is used when errors from Swarm are thrown

**Arguments**

1.  `status: number`: HTTP status code
1.  `message: string`: error message

**Properties**

- `status: number`: HTTP status code
- `message: string`: error message

## Bzz class

### new Bzz()

**Arguments**

1.  [`config: BzzConfig`](#bzzconfig), see below

**Configuration**

- `url: string`: address of the Swarm HTTP gateway
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

### .getPinURL()

Returns the Swarm URL for a pin based on the provided arguments.

**Arguments**

1.  `hash?: string`: hash of the resource
1.  `raw: boolean = false`

**Returns** `string`

### .hash()

Returns the hash of the provided `domain`.

**Arguments**

1.  `domain: string`
1.  [`options?: FetchOptions = {}`](#fetchoptions)

**Returns** `Promise<string>`

### .getTag()

**Arguments**

1.  `hash: string`
1.  [`options: FetchOptions`](#fetchoptions)

**Returns** `Promise<Tag>` the [`Tag`](#tag) of the given `hash`

## Immutables resources methods

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

### .downloadData()

Downloads and parses JSON data.

**Arguments**

1.  `hashOrDomain: string`: ENS name or Swarm hash
1.  [`options?: DownloadOptions = {}`](#downloadoptions)

**Returns** `Promise<any>`

### .uploadFile()

Uploads a single file and returns the hash. If the `contentType` option is provided, it will return the manifest hash, otherwise the file will be uploaded as raw data and will return the hash of the data itself.

**Arguments**

1.  `data: string | Buffer | Readable`
1.  [`options: UploadOptions = {}`](#uploadoptions)

**Returns** `Promise<string>`

### .uploadData()

Stringifies and uploads JSON data.

**Arguments**

1.  `data: any`
1.  [`options: UploadOptions = {}`](#uploadoptions)

**Returns** `Promise<string>`

### .deleteResource()

Deletes the resource with at the provided `path` in the manifest and returns the hash of the new manifest without this resource.

**Arguments**

1.  `hashOrDomain: string`: ENS name or Swarm hash
1.  `path: string`
1.  [`options?: FetchOptions = {}`](#fetchoptions)

**Returns** `Promise<string>`

## Pinning methods

> Pinning allows to persist files on a Swarm node. It has be enabled on the node for the following methods to work.

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

## BzzBrowser and BzzNode class

> The following methods are only provided by `@erebos/bzz-browser` and `@erebos/bzz-node`

### .downloadDirectory()

**Arguments**

1.  `hashOrDomain: string`: ENS name or Swarm hash
1.  [`options?: DownloadOptions = {}`](#downloadoptions)

**Returns** `Promise<DirectoryData>`

### .uploadDirectory()

Uploads multiple files and returns the hash of the manifest containing these files.

By setting the `defaultPath` option, a file can be defined as the default one when resolving a manifest root, for example a static website could be uploaded with the `index.html` default path so that accessing `bzz://domain.eth` would resolve to `bzz://domain.eth/index.html`.

**Arguments**

1.  [`data: DirectoryData`](#directorydata)
1.  [`options: UploadOptions = {}`](#uploadoptions)

**Returns** `Promise<string>`
