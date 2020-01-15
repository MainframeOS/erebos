---
title: Document synchronization
---

## Purpose

Synchronizes JSON documents from multiple sources using [Conflict-free Replicated Data Types](https://en.wikipedia.org/wiki/Conflict-free_replicated_data_type).

## Installation

```sh
npm install @erebos/doc-sync
```

> The various feed list classes must be injected a [`BzzFeed` instance](bzz-feed.md), so `@erebos/bzz-feed` must also be installed alongside.

## Usage

```javascript
import { DocSynchronizer, DocWriter } from '@erebos/doc-sync'

// simplified for brievity
const [alice, bob, chloe] = await Promise.all([
  DocWriter.init({ ... doc: { alice: 'hello' } }),
  DocWriter.init({ ... doc: { bob: 'hello' } }),
])

const chloe = await DocSynchronizer.init({
  ... // simplified for brievity
  doc: { chloe: 'hello' },
  sources: [alice.metaFeed, bob.metaFeed],
})
chloe.subscribe(doc => {
  // doc will change over time to become
  // { alice: 'one', bob: 'two', chloe: 'three' }
})

alice.change(doc => {
  doc.alice = 'one'
})
bob.change(doc => {
  doc.bob = 'two'
})
await Promise.all([alice.push(), bob.push()])

chloe.change(doc => {
  doc.chloe = 'three'
})
```

## Interfaces and types

### Change

`Change` interface exported by [Automerge](https://github.com/automerge/automerge)

### Doc

`Doc` interface exported by [Automerge](https://github.com/automerge/automerge)

### Bzz

Alias type using the [`BzzFeed` class](bzz-feed.md#bzzfeed-class)

```typescript
type Bzz = BzzFeed<any, Response>
```

### FeedFactoryParams

```typescript
interface FeedFactoryParams {
  user: string
  topic?: string
}
```

### DataContent

Uses [Change](#change)

```typescript
interface DataContent {
  changes: Array<Change>
}
```

### MetaSnapshot

```typescript
interface MetaSnapshot {
  hash: string
  time: number
}
```

### MetaContent

Uses [FeedParams](bzz-feed.md#feedparams) and [MetaSnapshot](#metasnapshot)

```typescript
interface MetaContent {
  dataFeed: FeedParams
  snapshot?: MetaSnapshot | undefined
}
```

### ProtocolContent

```typescript
interface ProtocolContent {
  protocol: string
  version: string
}
```

### DataPayload

Extends [DataContent](#datacontent) and [ProtocolContent](#protocolcontent)

```typescript
interface DataPayload extends DataContent, ProtocolContent {}
```

### MetaPayload

Extends [MetaContent](#metacontent) and [ProtocolContent](#protocolcontent)

```typescript
interface MetaPayload extends MetaContent, ProtocolContent {}
```

### DocFeeds

Uses [FeedParams](bzz-feed.md#feedparams)

```typescript
interface DocFeeds {
  data: FeedParams
  meta: FeedParams
}
```

### DocSerialized

Uses [FeedParams](bzz-feed.md#feedparams)

```typescript
interface DocSerialized {
  docString: string
  dataFeed: FeedParams
  metaFeed: FeedParams
}
```

### LoadDocReaderParams

Uses [FeedParams](bzz-feed.md#feedparams) and [Bzz](#bzz)

```typescript
interface LoadDocReaderParams<B extends Bzz = Bzz> {
  bzz: B
  feed: FeedParams // params for meta feed
}
```

### FromJSONDocReaderParams

Extends [DocSerialized](#docserialized)

Uses [Bzz](#bzz)

```typescript
interface FromJSONDocReaderParams<B extends Bzz = Bzz> extends DocSerialized {
  bzz: B
}
```

### DocReaderParams

Uses [FeedParams](bzz-feed.md#feedparams), [DataListReader class](feed-list.md#datalistreader-class), [Bzz](#bzz), [Doc](#doc) and [DataPayload](#datapayload)

```typescript
interface DocReaderParams<T, B extends Bzz = Bzz> {
  bzz: B
  doc: Doc<T>
  feed: FeedParams
  list: DataListReader<DataPayload, B>
  time: number
}
```

### DocSubscriberParams

Extends [DocReaderParams](#docreaderparams)

Uses [Bzz](#bzz)

```typescript
interface DocSubscriberParams<T, B extends Bzz = Bzz>
  extends DocReaderParams<T, B> {
  pullInterval: number
}
```

### FromJSONDocSubscriberParams

Extends [FromJSONDocReaderParams](#fromjsondocreaderparams)

Uses [Bzz](#bzz)

```typescript
interface FromJSONDocSubscriberParams<B extends Bzz = Bzz>
  extends FromJSONDocReaderParams<B> {
  pullInterval: number
}
```

### LoadDocSubscriberParams

Extends [LoadDocReaderParams](#loaddocreaderparams)

Uses [Bzz](#bzz)

```typescript
interface LoadDocSubscriberParams<B extends Bzz = Bzz>
  extends LoadDocReaderParams<B> {
  pullInterval: number
}
```

### CreateDocWriterParams

Uses [Bzz](#bzz) and [FeedFactoryParams](#feedfactoryparams)

```typescript
interface CreateDocWriterParams<B extends Bzz = Bzz> {
  bzz: B
  feed: FeedFactoryParams
  snapshotFrequency?: number
}
```

### InitDocWriterParams

Extends [CreateDocWriterParams](#createdocwriterparams)

Uses [Bzz](#bzz)

```typescript
interface InitDocWriterParams<T, B extends Bzz = Bzz>
  extends CreateDocWriterParams<B> {
  doc: T
}
```

### FromJSONDocWriterParams

Extends [FromJSONDocReaderParams](#fromjsondocreaderparams)

Uses [Bzz](#bzz)

```typescript
interface FromJSONDocWriterParams<B extends Bzz = Bzz>
  extends FromJSONDocReaderParams<B> {
  snapshotFrequency?: number
}
```

### LoadDocWriterParams

Extends [LoadDocReaderParams](#loaddocreaderparams)

Uses [Bzz](#bzz)

```typescript
interface LoadDocWriterParams<B extends Bzz = Bzz>
  extends LoadDocReaderParams<B> {
  snapshotFrequency?: number
}
```

### DocWriterParams

Uses [FeedParams](bzz-feed.md#feedparams), [DataListWriter class](feed-list.md#datalistwriter-class), [Bzz](#bzz), [Doc](#doc) and [DataPayload](#datapayload)

```typescript
interface DocWriterParams<T, B extends Bzz = Bzz> {
  bzz: B
  doc: Doc<T>
  feed: FeedParams
  list: DataListWriter<DataPayload, B>
  snapshotFrequency?: number
}
```

### InitDocSynchronizerParams

Extends [InitDocWriterParams](#initdocwriterparams)

Uses [FeedParams](bzz-feed.md#feedparams) and [Bzz](#bzz)

```typescript
interface InitDocSynchronizerParams<T, B extends Bzz = Bzz>
  extends InitDocWriterParams<T, B> {
  pullInterval: number
  pushInterval?: number
  sources?: Array<FeedParams>
}
```

### FromJSONSynchronizerParams

Extends [FromJSONDocWriterParams](#fromjsondocwriterparams)

Uses [Bzz](#bzz) and [DocSerialized](#docserialized)

```typescript
interface FromJSONDocSynchronizerParams<B extends Bzz = Bzz>
  extends FromJSONDocWriterParams<B> {
  pullInterval: number
  pushInterval?: number
  sources?: Array<DocSerialized>
}
```

### LoadDocSynchronizerParams

Extends [LoadDocWriterParams](#loaddocwriterparams)

Uses [FeedParams](bzz-feed.md#feedparams) and [Bzz](#bzz)

```typescript
interface LoadDocSynchronizerParams<B extends Bzz = Bzz>
  extends LoadDocWriterParams<B> {
  pullInterval: number
  pushInterval?: number
  sources?: Array<FeedParams>
}
```

### DocSynchronizerParams

Extends [DocWriterParams](#docwriterparams)

Uses [Bzz](#bzz) and [DocSubscriber](#docsubscriber-class)

```typescript
interface DocSynchronizerParams<T, B extends Bzz = Bzz>
  extends DocWriterParams<T, B> {
  pushInterval?: number
  sources?: Array<DocSubscriber<T, B>>
}
```

### DocSynchronizerSerialized

Extends and uses [DocSerialized](#docserialized)

```typescript
interface DocSynchronizerSerialized extends DocSerialized {
  sources: Array<DocSerialized>
}
```

## DocReader class

Extends [`BehaviorSubject<Doc<T>>`](https://rxjs.dev/api/index/class/BehaviorSubject)

**Types**

- `T = any`: the type of the document data

### new DocReader()

**Arguments**

1. [`params: DocReaderParams`](#docreaderparams)

### DocReader.fromJSON()

Creates a `DocReader` instance using a serialized document

**Arguments**

1. [`params: DocReaderFromJSONParams`](#docreaderfromjsonparams)

**Returns** `DocReader`

### DocReader.load()

Creates a `DocReader` instance loading the remote document

**Arguments**

1. [`params: DocReaderLoadParams`](#docreaderloadparams)

**Returns** `Promise<DocReader>`

### .metaFeed

**Returns** [`FeedParams`](bzz-feed.md#feedparams)

### .pull()

**Returns** `Promise<boolean>` whether the document has changed or not

### .toJSON()

**Returns** [`DocSerialized`](#docserialized)

## DocSubscriber class

Extends [`DocReader<T>`](#docreader-class)

**Types**

- `T = any`: the type of the document data

### new DocSubscriber()

**Arguments**

1. [`params: DocSubscriberParams`](#docsubscriberparams)

### DocSubscriber.fromJSON()

Creates a `DocSubscriber` instance using a serialized document

**Arguments**

1. [`params: DocSubscriberFromJSONParams`](#docsubscriberfromjsonparams)

**Returns** `DocSubscriber`

### DocSubscriber.load()

Creates a `DocSubscriber` instance loading the remote document

**Arguments**

1. [`params: DocSubscriberLoadParams`](#docsubscriberloadparams)

**Returns** `Promise<DocSubscriber>`

### .start()

Start polling changes

**Returns** `void`

### .stop()

Stop polling changes

**Returns** `void`

## DocWriter class

Extends [`DocReader<T>`](#docreader-class)

**Types**

- `T = any`: the type of the document data

### new DocWriter()

**Arguments**

1. [`params: DocWriterParams`](#docwriterparams)

### DocWriter.create()

Creates a new `DocWriter` instance with an empty document

**Arguments**

1. [`params: DocWriterCreateParams`](#docwritercreateparams)

**Returns** `DocWriter`

### DocWriter.init()

Creates a new `DocWriter` instance with a provided document and push it remotely

**Arguments**

1. [`params: DocWriterInitParams`](#docwriterinitparams)

**Returns** `Promise<DocWriter>`

### DocWriter.fromJSON()

Creates a `DocWriter` instance using a serialized document

**Arguments**

1. [`params: DocWriterFromJSONParams`](#docwriterfromjsonparams)

**Returns** `DocWriter`

### DocWriter.load()

Creates a `DocWriter` instance loading the remote document

**Arguments**

1. [`params: DocWriterLoadParams`](#docwriterloadparams)

**Returns** `Promise<DocWriter>`

### .length

**Returns** `number` the number of changes that have been published

### .change()

**Arguments**

1. `updater: (doc: T) => void` the function mutating the document data

**Returns** `boolean` whether the document has changed or not

### .merge()

**Arguments**

1. `other: Doc<T>` the other document to merge with

**Returns** `boolean` whether the document has changed or not

### .push()

Pushes the changes to the remote feed. If there is no change to push, it will return `null`, otherwise it will return the Swarm hash where the updated metadata has been uploaded.

**Returns** `Promise<string | null>`

## DocSynchronizer class

Extends [`DocWriter<T>`](#docwriter-class)

**Types**

- `T = any`: the type of the document data

### new DocSynchronizer()

**Arguments**

1. [`params: DocSynchronizerParams`](#docsynchronizerparams)

### DocSynchronizer.init()

Creates a new `DocSynchronizer` instance with a provided document and push it remotely

**Arguments**

1. [`params: DocWSynchronizerInitParams`](#docsynchronizerinitparams)

**Returns** `Promise<DocSynchronizer>`

### DocSynchronizer.fromJSON()

Creates a `DocSynchronizer` instance using a serialized document

**Arguments**

1. [`params: DocSynchronizerFromJSONParams`](#docsynchronizerfromjsonparams)

**Returns** `DocSynchronizer`

### DocSynchronizer.load()

Creates a `DocSynchronizer` instance loading the remote document

**Arguments**

1. [`params: DocSynchronizerLoadParams`](#docsynchronizerloadparams)

**Returns** `Promise<DocSynchronizer>`

### .start()

Start polling changes from sources and pushing own changes

**Returns** `void`

### .stop()

Stop polling changes from sources and pushing own changes

**Returns** `void`

### .pullSources()

Pull changes from sources

**Returns** `Promise<boolean>` whether the document has changed or not

### .toJSON()

**Returns** [`DocSynchronizerSerialized`](#docsynchronizerserialized)
