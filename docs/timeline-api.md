---
title: Timeline API
---

## Installation

```sh
npm install @erebos/timeline
```

> The Timeline classes must be injected a [`BzzFeed` instance](bzz-feed.md), so `@erebos/bzz-feed` must also be installed alongside.

## Usage

```javascript
import { BzzFeed } from '@erebos/bzz-feed'
import { BzzNode } from '@erebos/bzz-node'
import { TimelineReader, TimelineWriter } from '@erebos/timeline'

const user = '0x...'
const bzz = new BzzNode({ ... }) // Check the Bzz API documentation for more details
const bzzFeed = new BzzFeed({ ... }) // Check the Bzz API documentation for more details
const config = { bzz: bzzFeed, feed: { user, name: 'hello-timeline' } }

const writer = new TimelineWriter(config)
await writer.addChapter({ author: user, contents: { hello: 'world' } })

const reader = new TimelineReader(config)
const chapterID = await reader.getChapterID()
```

## Interfaces and types

### hexValue

Hexadecimal-encoded string prefixed with `0x`. This type is exported by the [`@erebos/hex` package](hex.md).

### PartialChapter

```typescript
interface PartialChapter<T = any> {
  protocol: string
  version: string
  timestamp: number
  author: string
  type: string
  content: T
  previous?: string | null
  references?: Array<string>
  signature?: string
}
```

### Chapter

```typescript
interface Chapter<T = any> extends PartialChapter<T> {
  id: string
}
```

### LiveOptions

Extends [PollOptions](bzz.md#polloptions)

```typescript
interface LiveOptions extends PollOptions {
  previous?: string
  timestamp?: number
}
```

### TimelineReaderConfig

`bzz` is a [BzzFeed instance](bzz-feed.md#bzzfeed-class) and `feed` can either be a feed manifest hash or [feed parameters](bzz-feed.md#feedparams).

```typescript
interface TimelineConfig<
  T = any,
  B extends BzzFeed<any,  Response<any> = BzzFeed<any,  Response<any>
> {
  bzz: B
  feed: string | FeedParams
}
```

### TimelineWriterConfig

Extends [`TimelineReaderConfig`](#timelinereaderconfig)

```typescript
interface TimelineWriterConfig<
  T = any,
  B extends BzzFeed<any,  Response<any> = BzzFeed<any,  Response<any>
> extends TimelineReaderConfig<T, B> {
  signParams?: any
}
```

## API

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

## TimelineReader class

**Types**

- `T = any`: the type of the TimelineReader chapters data

### new TimelineReader()

**Arguments**

1.  [`config: TimelineReaderConfig<T>`](#timelinereaderconfig), see below

**Configuration**

- [`bzz: BzzFeed`](bzz-feed.md#bzzfeed-class): Bzz instance
- `feed: string | FeedParams`: either a feed manifest hash or [feed parameters](bzz-feed.md#feedparams).

### .getChapter()

**Arguments**

1.  `id: string`: ID of the chapter (Swarm hash)
1.  [`options?: FetchOptions = {}`](bzz.md#fetchoptions)

**Returns** `Promise<Chapter<T>>`

### .getLatestChapterID()

Retrieves the ID of the latest chapter in the timeline.

**Arguments**

1.  [`options?: FetchOptions = {}`](bzz.md#fetchoptions)

**Returns** `Promise<hexValue | null>` the ID of the chapter (Swarm hash) if found, `null` otherwise

### .getLatestChapter()

Loads the latest chapter in the timeline.

**Arguments**

1.  [`options?: FetchOptions = {}`](bzz.md#fetchoptions)

**Returns** `Promise<Chapter<T> | null>` the chapter if found, `null` otherwise

### .pollLatestChapter()

Returns a [RxJS `Observable`](https://rxjs.dev/api/index/class/Observable) emitting the latest chapter at the provided `interval`.

**Arguments**

1.  [`options: PollOptions`](bzz.md#polloptions): providing the `interval` field with the number of milliseconds between each query to the timeline

**Returns** `Observable<Chapter<T>>`

### .createIterator()

Creates an async iterator of chapters, from the latest to oldest chapter.

**Arguments**

1.  `initialID?: string`: optional initial chapter ID, if not provided the latest chapter ID of the timeline will be fetched when the iteration starts
1.  [`options?: FetchOptions = {}`](bzz.md#fetchoptions)

**Returns** `AsyncIterator<Chapter<T>>`

### .createLoader()

Returns [RxJS `Observable`](https://rxjs.dev/api/index/class/Observable) emitting chapters between the given newest (inclusive) and oldest (exclusive) chapter ID boundaries.

**Arguments**

1.  `newestID: string`: newest chapter ID to load
1.  `oldestID: string`: oldest chapter ID, this chapter will **not** be emitted by the created Observable
1.  [`options?: FetchOptions = {}`](bzz.md#fetchoptions)

**Returns** `Observable<Chapter<T>>`

### .getChapters()

Loads a range of chapters between the given newest (inclusive) and oldest (exclusive) chapter ID boundaries.

**Arguments**

1.  `newestID: string`: newest chapter ID to load
1.  `oldestID: string`: oldest chapter ID, this chapter will **not** be returned in the resulting array
1.  [`options?: FetchOptions = {}`](bzz.md#fetchoptions)

**Returns** `Array<Chapter<T>>`

### .live()

Returns a [RxJS `Observable`](https://rxjs.dev/api/index/class/Observable) emitting an array of chapters added during the provided `interval`.

**Arguments**

1.  [`options: LiveOptions`](#liveoptions): providing the `interval` field with the number of milliseconds between each query to the timeline

**Returns** `Observable<Array<Chapter<T>>>`

## TimelineWriter class

Extends [`TimelineReader`](#timelinereader-class)

**Types**

- `T = any`: the type of the TimelineWriter chapters data

### new TimelineWriter()

**Arguments**

1.  [`config: TimelineWriterConfig<T>`](#timelinewriterconfig), see below

**Configuration**

Includes [`TimelineReaderConfig`](#timelinereaderconfig)

- [`bzz: BzzFeed`](bzz-feed.md#bzzfeed-class): BzzFeed instance
- `feed: string | FeedParams`: either a feed manifest hash or [feed parameters](bzz-feed.md#feedparams).
- `signParams?: any`: optional signing parameters provided to the [`signBytes() function`](bzz-feed.md#signbytesfunc) when updating a the timeline feed.

### .postChapter()

**Arguments**

1.  [`chapter: PartialChapter<T>`](#partialchapter)
1.  [`options?: UploadOptions = {}`](bzz.md#uploadoptions)

**Returns** `Promise<hexValue>` the ID of the uploaded chapter (Swarm hash)

### .setLatestChapterID()

Sets the ID of the latest chapter in the timeline.

**Arguments**

1.  `id: string`: the chapter ID (Swarm hash)
1.  [`options?: FetchOptions = {}`](bzz.md#fetchoptions)

**Returns** `Promise<void>`

### .setLatestChapter()

Sets the latest chapter of the timeline. This is equivalent of calling [`postChapter()`](#postchapter) and [`setLatestChapterID()`](#setlatestchapterid).

**Arguments**

1.  `chapter: PartialChapter<T>`
1.  [`options?: UploadOptions = {}`](bzz.md#uploadoptions)

**Returns** `Promise<hexValue>` the ID of the uploaded chapter (Swarm hash)

### .addChapter()

Adds a chapter to the timeline. This is similar to [`setLatestChapter()`](#setlatestchapter), except [`getLatestChapterID()`](#getlatestchapterid) will be called to retrieved the id of the `previous` chapter if not provided.

**Arguments**

1.  `chapter: PartialChapter<T>`
1.  [`options?: UploadOptions = {}`](bzz.md#uploadoptions)

**Returns** `Promise<Chapter<T>>` the uploaded chapter

### .createAddChapter()

Creates a function that will add a chapter to the timeline every time it is called.

⚠️ This function only keeps track of the updates it is making, not other possible updates on the timeline (such as performed when calling [`setLatestChapterID()`](#setlatestchapterid) and [`addChapter()`](#addchapter)).  
Make sure all the timeline updates are performed using the created updater function for a given timeline.

**Arguments**

1.  [`chapterDefaults?: Partial<PartialChapter<T>> = {}`](#partialchapter): default values for all the chapters that will be added
1.  [`options?: UploadOptions = {}`](bzz.md#uploadoptions)

**Returns** `(chapter: Partial<PartialChapter<T>>) => Promise<Chapter<T>>` the chapter adding function
