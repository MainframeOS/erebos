---
title: Bzz FS API
---

## Installation

```sh
npm install @erebos/bzz-fs
```

## Usage

```javacript
import { BzzFS } from '@erebos/bzz-fs'
import { BzzNode } from '@erebos/bzz-node'

const bzz = new BzzNode({ url: 'http://localhost:8500' })
const bzzFS = new BzzFS({ bzz })
```

### BzzFSConfig

```typescript
interface BzzFSConfig {
  basePath?: string
  bzz: BzzNode | string
}
```

## BzzFS class

### new BzzFS()

**Arguments**

1.  [`config: BzzFSConfig`](#bzzfsconfig), see below

**Configuration**

- `basePath?: string`: the base path to resolve relative paths to
- `bzz: BzzNode | string`: the `BzzNode` instance or gateway URL

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
