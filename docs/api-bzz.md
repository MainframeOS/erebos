# BZZ API

```js
import Bzz from 'erebos-api-bzz-browser' // browser
// or
import Bzz from 'erebos-api-bzz-node' // node
```

### new Bzz()

Creates a Bzz instance using the server provided as `url`.

**Arguments**

1.  `url: string`

### .uploadRaw()

Uploads the provided `data` to the `bzzr:` endpoint and returns the created
hash.\
The `content-length` header will be added to the `headers` Object based on the `data`.

**Arguments**

1.  `data: string | Buffer`
1.  `headers?: Object = {}`

**Returns** `Promise<Response>`

### .downloadRaw()

Downloads the file matching the provided `hash` using the `bzzr:` endpoint.

**Arguments**

1.  `hash: string`

**Returns** `Promise<Response>`

### .downloadRawBlob()

**⚠️ Browser only - not available when using Node**\
Downloads the file matching the provided `hash` as a [`Blob`](https://developer.mozilla.org/en-US/docs/Web/API/Blob).

**Arguments**

1.  `hash: string`

**Returns** `Promise<Blob>`

### .downloadRawBuffer()

**⚠️ Node only - not available in browser**\
Downloads the file matching the provided `hash` as a [`Buffer`](https://nodejs.org/dist/latest-v9.x/docs/api/buffer.html#buffer_buffer).

**Arguments**

1.  `hash: string`

**Returns** `Promise<Buffer>`

### .downloadRawText()

Downloads the file matching the provided `hash` as a string.

**Arguments**

1.  `hash: string`

**Returns** `Promise<string>`
