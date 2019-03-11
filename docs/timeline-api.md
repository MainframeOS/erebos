---
title: Timeline API
---

## Usage

```javascript
import BzzAPI from '@erebos/api-bzz-node'
import { Timeline } from '@erebos/timeline'

const user = '0x...'
const bzz = new BzzAPI({ ... }) // Check the Bzz API documentation for more details
const timeline = new Timeline({ bzz, feed: { user, name: 'hello-timeline' } })

await timeline.addChapter({ author: user, contents: { hello: 'world' } })
const chapterID = await timeline.getChapterID()
```

## Flow types

### hexValue

Hexadecimal-encoded string prefixed with `0x`. This type is exported by the [`@erebos/hex` package](hex.md).

### JSONValue

```js
type JSONValue =
  | null
  | boolean
  | number
  | string
  | Array<JSONValue>
  | { [key: string]: JSONValue }
```

### PartialChapter

```js
type PartialChapter<T = JSONValue> = {
  protocol: 'timeline',
  version: 1,
  timestamp: number,
  author: string,
  type: string,
  content: T,
  previous?: ?string,
  references?: ?Array<string>,
  signature?: string,
}
```

### Chapter

```js
type Chapter<T = JSONValue> = PartialChapter<T> & { id: string }
```

### DecodeChapter

```js
type DecodeChapter<T> = (res: *) => Promise<Chapter<T>>
```

### EncodeChapter

```js
type EncodeChapter<T> = (chapter: PartialChapter<T>) => Promise<string | Buffer>
```

### LiveOptions

Includes [FetchOptions](api-bzz.md#fetchoptions)

```js
type LiveOptions = {
  headers?: Object,
  timeout?: ?number,
  interval: number,
}
```

### TimelineConfig

`bzz` is a [Bzz instance](api-bzz.md#bzz-class-default-export) and `feed` can either be a feed manifest hash or [feed paramters](api-bzz.md#feedparams).

```js
type TimelineConfig = {
  bzz: Bzz,
  feed: string | FeedParams,
  decode?: ?DecodeChapter<*>,
  encode?: ?EncodeChapter<*>,
  signParams?: any,
}
```

## Public API

### createChapter()

Creates a [PartialChapter](#partialchapter) with the following default fields values:

- `protocol`: `timeline`
- `version`: `1`
- `type`: `application/json`
- `timestamp`: current UNIX timestamp

**Arguments**

1.  `chapter: PartialChapter<T>`

**Returns** `PartialChapter<T>`

### validateChapter()

Validates that the provided object contains the `protocol` and `version` fields with the expected values.

**Arguments**

1.  `maybeChapter: T = Object`

**Returns** `T`

### Timeline class

**Arguments**

1.  [`config: TimelineConfig`](#timelineconfig), see below

**Configuration**

- [`bzz: Bzz`](api-bzz.md#bzz-class-default-export): Bzz instance
- `feed: string | FeedParams`: either a feed manifest hash or [feed parameters](api-bzz.md#feedparams).
- [`decode?: ?DecodeChapter<*>`](#decodechapter): optional chapter decoding function used when loading any chapter with this timeline instance
- [`encode?: ?EncodeChapter<*>`](#encodechapter): optional chapter encoding function used when adding any chapter with this timeline instance
- `signParams?: any`: optional signing parameters provided to the [`signBytes() function`](api-bzz.md#signbytesfunc) when updating a the timeline feed.

### .download()

**Arguments**

1.  `id: string`: ID of the chapter (Swarm hash)
1.  [`options?: FetchOptions = {}`](api-bzz.md#fetchoptions)

**Returns** `Promise<Chapter<T>>`

### .upload()

**Arguments**

1.  [`chapter: PartialChapter<T>`](#partialchapter)
1.  [`options?: UploadOptions = {}`](api-bzz.md#uploadoptions)

**Returns** `Promise<hexValue>` the ID of the uploaded chapter (Swarm hash)

### .getChapterID()

Retrieves the ID of the latest chapter in the timeline.

**Arguments**

1.  [`options?: FetchOptions = {}`](api-bzz.md#fetchoptions)

**Returns** `Promise<hexValue | null>` the ID of the chapter (Swarm hash) if found, `null` otherwise

### .loadChapter()

Loads the latest chapter in the timeline.

**Arguments**

1.  [`options?: FetchOptions = {}`](api-bzz.md#fetchoptions)

**Returns** `Promise<Chapter<T> | null>` the chapter if found, `null` otherwise

### .updateChapterID()

Updates the ID of the latest chapter in the timeline.

**Arguments**

1.  `id: string`: the chapter ID (Swarm hash)
1.  [`options?: FetchOptions = {}`](api-bzz.md#fetchoptions)

**Returns** `Promise<void>`

### .addChapter()

Adds a chapter to the timeline. This is equivalent of calling [`upload()`](#upload) and [`updateChapterID()`](#updatechapterid).

**Arguments**

1.  `chapter: PartialChapter<T>`
1.  [`options?: UploadOptions = {}`](api-bzz.md#uploadoptions)

**Returns** `Promise<hexValue>` the ID of the uploaded chapter (Swarm hash)

### .createUpdater()

Creates an updater function that will add a chapter to the timeline every time it is called.

⚠️ This function only keeps track of the updates it is making, not other possible updates on the timeline (such as performed when calling [`updateChapterID()`](#updatechapterid) and [`addChapter()`](#addchapter)).  
Make sure all the timeline updates are performed using the created updater function for a given timeline.

**Arguments**

1.  [`chapterDefaults?: $Shape<PartialChapter<T>> = {}`](#partialchapter): default values for all the chapters that will be added
1.  [`options?: UploadOptions = {}`](api-bzz.md#uploadoptions)

**Returns** `(chapter: $Shape<PartialChapter<T>>) => Promise<Chapter<T>>` the updater function

### .createIterator()

Creates an async iterator of chapters, from the latest to oldest chapter.

**Arguments**

1.  `initialID?: string`: optional initial chapter ID, if not provided the latest chapter ID of the timeline will be fetched when the iteration starts
1.  [`options?: FetchOptions = {}`](api-bzz.md#fetchoptions)

**Returns** `AsyncIterator<Chapter<T>>`

### .loadChapters()

Loads a range of chapters between the given newest (inclusive) and oldest (exclusive) chapter ID boundaries.

**Arguments**

1.  `newestID: string`: newest chapter ID to load
1.  `oldestID: string`: oldest chapter ID, this chapter will **not** be returned in the resulting array
1.  [`options?: FetchOptions = {}`](api-bzz.md#fetchoptions)

**Returns** `Array<Chapter<T>>`

### .live()

Returns a [RxJS `Observable`](https://rxjs.dev/api/index/class/Observable) emitting an array of chapters added during the provided `interval`.

**Arguments**

1.  [`options: LiveOptions`](#liveoptions): providing the `interval` field with the number of milliseconds between each query to the timeline

**Returns** `Observable<Array<Chapter<T>>>`
