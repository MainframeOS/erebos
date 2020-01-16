---
title: Feed lists
---

## Purpose

Feed lists are list-like data structures and APIs built on top of raw Swarm feeds.

## Installation

```sh
npm install @erebos/feed-list
```

> The various feed list classes must be injected a [`BzzFeed` instance](bzz-feed.md), so `@erebos/bzz-feed` must also be installed alongside.

## Usage

### Chunk lists

> Feed chunks have a maximum size of `3963` bytes (4KB minus headers and signature)

```javascript
import { BzzFeed } from '@erebos/bzz-feed'
import { BzzNode } from '@erebos/bzz-node'
import { ChunkListReader, ChunkListWriter } from '@erebos/feed-list'
import { pubKeyToAddress } from '@erebos/keccak256'
import { createKeyPair, sign } from '@erebos/secp256k1'

// This setup is meant for demonstration purpose only - keys and signatures security must be handled by the application
const keyPair = createKeyPair()
const signBytes = async bytes => sign(bytes, keyPair)
const bzz = new BzzNode({ url: 'http://localhost:8500' })
const bzzFeed = new BzzFeed({ bzz, signBytes })

const aliceAddress = pubKeyToAddress(keyPair.getPublic('array'))
const aliceWriter = new ChunkListWriter({
  bzz: bzzFeed,
  feed: { user: aliceAddress, name: 'alice-bob' },
})
await aliceWriter.push('one')
await aliceWriter.push('two')

const feed = aliceWriter.getID()
const bobReader = new ChunkListReader({ bzz: bzzFeed, feed })
const chunk = await bobReader.load(1)
const text = chunk.toString() // 'two'
```

### Data lists

> Data lists store entries in JSON files and reference them in feed chunks

```javascript
import { BzzFeed } from '@erebos/bzz-feed'
import { BzzNode } from '@erebos/bzz-node'
import { DataListReader, DataListWriter } from '@erebos/feed-list'
import { pubKeyToAddress } from '@erebos/keccak256'
import { createKeyPair, sign } from '@erebos/secp256k1'

// This setup is meant for demonstration purpose only - keys and signatures security must be handled by the application
const keyPair = createKeyPair()
const signBytes = async bytes => sign(bytes, keyPair)
const bzz = new BzzNode({ url: 'http://localhost:8500' })
const bzzFeed = new BzzFeed({ bzz, signBytes })

const aliceAddress = pubKeyToAddress(keyPair.getPublic('array'))
const aliceWriter = new DataListWriter({
  bzz: bzzFeed,
  feed: { user: aliceAddress, name: 'alice-bob' },
})
await aliceWriter.push({ hello: 'world' })
await aliceWriter.push({ hello: 'Bob' })

const feed = aliceWriter.getID()
const bobReader = new DataListReader({ bzz: bzzFeed, feed })
const data = await bobReader.load(1) // { hello: 'Bob' }
```

## Interfaces and types

### Hex

`Hex` class instance as exported by the [`@erebos/hex` package](hex.md).

### ForwardsChunkIterator

```typescript
interface ForwardsChunkIterator<T> extends AsyncIterator<T> {
  length: number
}
```

### ListReaderConfig

The [`BzzFeed class`](bzz-feed.md#bzzfeed-class), [`FeedID class`](bzz-feed.md#feedid-class), [`FeedParams`](bzz-feed.md#feedparams) are exported by the [`@erebos/bzz-feed` package](bzz-feed.md).

The and [`FetchOptions`](bzz.md#fetchoptions) interface is exported by the [`@erebos/bzz` package](bzz.md).

```typescript
export interface ListReaderConfig<
  B extends BzzFeed<any,  Response<any> = BzzFeed<any,  Response<any>
> {
  bzz: B
  feed: FeedID | FeedParams
  fetchOptions?: FetchOptions
}
```

### ListWriterConfig

Extends [`ListReaderConfig`](#listwriterconfig)

```typescript
export interface ListWriterConfig<
  B extends BzzFeed<any,  Response<any> = BzzFeed<any,  Response<any>
> extends ListReaderConfig<B> {
  signParams?: any
}
```

## ChunkListReader class

### new ChunkListReader()

**Arguments**

1.  [`config: ListReaderConfig`](#listreaderconfig)

### .load()

**Arguments**

1.  `index: number`

**Returns** `Hex | null`

### .createBackwardsIterator()

**Arguments**

1.  `maxIndex: number`
1.  `minIndex?: number = 0`

**Returns** `AsyncIterator<Hex | null>`

### .createForwardsIterator()

**Arguments**

1.  `minIndex?: number = 0`
1.  `maxIndex?: number`

**Returns** [`ForwardsChunkIterator<Hex>`](#forwardschunkiterator)

## ChunkListWriter class

Extends [`ChunkListReader`](#chunklistreader)

### new ChunkListWriter()

**Arguments**

1.  [`config: ListWriterConfig`](#listwriterconfig)

### .length

**Returns** `number`

### .getID()

**Returns** [`FeedID`](bzz-feed.md#feedid-class)

### .push()

**Arguments**

1.  `data: hexInput`

**Returns** `Promise<void>`

## DataListReader class

**Types**

- `T = any`: the type of the list data

### new DataListReader()

**Arguments**

1.  [`config: ListReaderConfig`](#listreaderconfig)

### .load()

**Arguments**

1.  `index: number`

**Returns** `T`

### .createBackwardsIterator()

**Arguments**

1.  `maxIndex: number`
1.  `minIndex?: number = 0`

**Returns** `AsyncIterator<T | null>`

### .createForwardsIterator()

**Arguments**

1.  `minIndex?: number = 0`
1.  `maxIndex?: number`

**Returns** [`ForwardsChunkIterator<T>`](#forwardschunkiterator)

## DataListWriter class

Extends [`DataListReader`](#datalistreader)

**Types**

- `T = any`: the type of the list data

### new DataListWriter()

**Arguments**

1.  [`config: ListWriterConfig`](#listwriterconfig)

### .length

**Returns** `number`

### .getID()

**Returns** [`FeedID`](bzz-feed.md#feedid-class)

### .push()

**Arguments**

1.  `data: T`

**Returns** `Promise<void>`
