---
title: Feed lists
---

## Purpose

Feed lists are list-like data structures and APIs built on top of raw Swarm feeds.

## Installation

```sh
npm install @erebos/feed-list
```

> The various feed list classes must be injected a [`Bzz` instance](api-bzz.md), so `@erebos/api-bzz-browser` or `@erebos/api-bzz-node` must also be installed alongside.

## Usage

### Chunk lists

> Feed chunks have a maximum size of `3963` bytes (4KB minus headers and signature)

```javascript
import { Bzz } from '@erebos/api-bzz-node'
import { ChunkListReader, ChunkListWriter } from '@erebos/feed-list'
import { pubKeyToAddress } from '@erebos/keccak256'
import { createKeyPair, sign } from '@erebos/secp256k1'

// This setup is meant for demonstration purpose only - keys and signatures security must be handled by the application
const keyPair = createKeyPair()
const signBytes = async bytes => sign(bytes, keyPair)
const bzz = new Bzz({ url: 'http://localhost:8500', signBytes })

const aliceAddress = pubKeyToAddress(keyPair.getPublic('array'))
const aliceWriter = new ChunkListWriter({
  bzz,
  feed: { user: aliceAddress, name: 'alice-bob' },
})
await aliceWriter.push('one')
await aliceWriter.push('two')

const feed = aliceWriter.getID()
const bobReader = new ChunkListReader({ bzz, feed })
const chunk = await bobReader.load(1)
const text = chunk.toString() // 'two'
```

### Data lists

> Data lists store entries in JSON files and reference them in feed chunks

```javascript
import { Bzz } from '@erebos/api-bzz-node'
import { DataListReader, DataListWriter } from '@erebos/feed-list'
import { pubKeyToAddress } from '@erebos/keccak256'
import { createKeyPair, sign } from '@erebos/secp256k1'

// This setup is meant for demonstration purpose only - keys and signatures security must be handled by the application
const keyPair = createKeyPair()
const signBytes = async bytes => sign(bytes, keyPair)
const bzz = new Bzz({ url: 'http://localhost:8500', signBytes })

const aliceAddress = pubKeyToAddress(keyPair.getPublic('array'))
const aliceWriter = new DataListWriter({
  bzz,
  feed: { user: aliceAddress, name: 'alice-bob' },
})
await aliceWriter.push({ hello: 'world' })
await aliceWriter.push({ hello: 'Bob' })

const feed = aliceWriter.getID()
const bobReader = new DataListReader({ bzz, feed })
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

The [`Bzz class`](api-bzz.md#bzz-class), [`FeedID`](api-bzz.md#feedid), [`FeedParams`](api-bzz.md#feedparams) and [`FetchOptions`](api-bzz.md#fetchoptions) interfaces are exported by the [Bzz APIs packages](api-bzz.md).

```typescript
export interface ListReaderConfig<
  Bzz extends BaseBzz<BaseResponse, Readable> = BaseBzz<BaseResponse, Readable>
> {
  bzz: Bzz
  feed: FeedID | FeedParams
  fetchOptions?: FetchOptions
}
```

### ListWriterConfig

Extends [`ListReaderConfig`](#listwriterconfig)

```typescript
export interface ListWriterConfig<
  Bzz extends BaseBzz<BaseResponse, Readable> = BaseBzz<BaseResponse, Readable>
> extends ListReaderConfig<Bzz> {
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

**Returns** [`FeedID`](api-bzz.md#feedid)

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

**Returns** [`FeedID`](api-bzz.md#feedid)

### .push()

**Arguments**

1.  `data: T`

**Returns** `Promise<void>`
