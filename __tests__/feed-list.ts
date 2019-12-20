import {
  MAX_CHUNK_BYTE_LENGTH,
  ChunkListReader,
  ChunkListWriter,
  DataListReader,
  DataListWriter,
  ListReaderConfig,
} from '@erebos/feed-list'
import { Bzz } from '@erebos/api-bzz-node'
import { pubKeyToAddress } from '@erebos/keccak256'
import { createKeyPair, sign } from '@erebos/secp256k1'

describe('feed-list', () => {
  function createConfig(): ListReaderConfig {
    const keyPair = createKeyPair()
    const user = pubKeyToAddress(keyPair.getPublic('array'))
    const bzz = new Bzz({
      signBytes: (bytes: Array<number>) =>
        Promise.resolve(sign(bytes, keyPair)),
      url: 'http://localhost:8500',
    })
    return { bzz, feed: { user } }
  }

  describe('chunk list', () => {
    it('ChunkListWriter extends ChunkListReader', () => {
      const writer = new ChunkListWriter(createConfig())
      expect(writer).toBeInstanceOf(ChunkListReader)
    })

    it('works with a simple flow', async () => {
      const config = createConfig()
      const reader = new ChunkListReader(config)
      const writer = new ChunkListWriter(config)

      const data = { hello: 'world' }
      await writer.push(data)
      expect(writer.length).toBe(1)

      const writerLoaded = await writer.load(0)
      expect(writerLoaded.toObject()).toEqual(data)

      const readerLoaded = await reader.load(0)
      expect(readerLoaded.toObject()).toEqual(data)
    })

    it('enforces a max chunk size', async () => {
      const config = createConfig()
      const writer = new ChunkListWriter(config)

      await writer.push(Buffer.alloc(MAX_CHUNK_BYTE_LENGTH))

      await expect(
        writer.push(Buffer.alloc(MAX_CHUNK_BYTE_LENGTH + 1)),
      ).rejects.toThrow(
        `Chunk exceeds max length of ${MAX_CHUNK_BYTE_LENGTH} bytes`,
      )
    })

    it('supports forwards iteration', async () => {
      const config = createConfig()

      const reader = new ChunkListReader(config)
      const writer = new ChunkListWriter(config)

      await writer.push('one')
      await writer.push('two')
      await writer.push('three')
      expect(writer).toHaveLength(3)

      const iteratorFromStart = reader.createForwardsIterator()
      const dataFromStart = []
      for await (const chunk of iteratorFromStart) {
        dataFromStart.push(chunk.toString())
      }
      expect(dataFromStart).toEqual(['one', 'two', 'three'])
      expect(iteratorFromStart).toHaveLength(3)

      await writer.push('four')
      expect(writer).toHaveLength(4)

      const iteratorFromIndex = reader.createForwardsIterator(1)
      const dataFromIndex = []
      for await (const chunk of iteratorFromIndex) {
        dataFromIndex.push(chunk.toString())
      }
      expect(dataFromIndex).toEqual(['two', 'three', 'four'])
      expect(iteratorFromIndex).toHaveLength(3)

      const iteratorFromToIndex = reader.createForwardsIterator(1, 2)
      const dataFromToIndex = []
      for await (const chunk of iteratorFromToIndex) {
        dataFromToIndex.push(chunk.toString())
      }
      expect(dataFromToIndex).toEqual(['two', 'three'])
      expect(iteratorFromToIndex).toHaveLength(2)
    })

    it('supports backwards iteration', async () => {
      const config = createConfig()
      const reader = new ChunkListReader(config)
      const writer = new ChunkListWriter(config)

      await writer.push('one')
      await writer.push('two')
      await writer.push('three')
      expect(writer).toHaveLength(3)

      const dataFrom = []
      for await (const chunk of reader.createBackwardsIterator(4)) {
        dataFrom.push(chunk === null ? null : chunk.toString())
      }
      expect(dataFrom).toEqual([null, null, 'three', 'two', 'one'])

      const dataFromTo = []
      for await (const chunk of reader.createBackwardsIterator(3, 1)) {
        dataFromTo.push(chunk === null ? null : chunk.toString())
      }
      expect(dataFromTo).toEqual([null, 'three', 'two'])
    })

    it('ChunkListWriter has a getID() method', async () => {
      const config = createConfig()
      const reader = new ChunkListReader(config)
      const writer = new ChunkListWriter(config)

      await writer.push('one')
      await writer.push('two')
      await writer.push('three')

      const id = writer.getID()
      expect(id.time).toBe(writer.length - 1)

      const chunk = await reader.load(id.time)
      expect(chunk.toString()).toBe('three')
    })
  })

  describe('data list', () => {
    it('DataListWriter extends DataListReader', () => {
      const writer = new DataListWriter(createConfig())
      expect(writer).toBeInstanceOf(DataListReader)
    })

    it('works with a simple flow', async () => {
      const config = createConfig()
      const reader = new DataListReader(config)
      const writer = new DataListWriter(config)

      const data = { hello: 'world' }
      await writer.push(data)
      expect(writer.length).toBe(1)

      const writerData = await writer.load(0)
      expect(writerData).toEqual(data)

      const readerData = await reader.load(0)
      expect(readerData).toEqual(data)
    })

    it('supports forwards iteration', async () => {
      const config = createConfig()

      const reader = new DataListReader(config)
      const writer = new DataListWriter(config)

      await writer.push({ test: 'one' })
      await writer.push({ test: 'two' })
      await writer.push({ test: 'three' })
      expect(writer).toHaveLength(3)

      const iteratorFromStart = reader.createForwardsIterator()
      const dataFromStart = []
      for await (const data of iteratorFromStart) {
        dataFromStart.push(data)
      }
      expect(dataFromStart).toEqual([
        { test: 'one' },
        { test: 'two' },
        { test: 'three' },
      ])
      expect(iteratorFromStart).toHaveLength(3)

      await writer.push({ test: 'four' })
      expect(writer).toHaveLength(4)

      const iteratorFromIndex = reader.createForwardsIterator(1)
      const dataFromIndex = []
      for await (const data of iteratorFromIndex) {
        dataFromIndex.push(data)
      }
      expect(dataFromIndex).toEqual([
        { test: 'two' },
        { test: 'three' },
        { test: 'four' },
      ])
      expect(iteratorFromIndex).toHaveLength(3)

      const iteratorFromToIndex = reader.createForwardsIterator(1, 2)
      const dataFromToIndex = []
      for await (const data of iteratorFromToIndex) {
        dataFromToIndex.push(data)
      }
      expect(dataFromToIndex).toEqual([{ test: 'two' }, { test: 'three' }])
      expect(iteratorFromToIndex).toHaveLength(2)
    })

    it('supports backwards iteration', async () => {
      const config = createConfig()
      const reader = new DataListReader(config)
      const writer = new DataListWriter(config)

      await writer.push({ test: 'one' })
      await writer.push({ test: 'two' })
      await writer.push({ test: 'three' })
      expect(writer).toHaveLength(3)

      const listFrom = []
      for await (const data of reader.createBackwardsIterator(4)) {
        listFrom.push(data)
      }
      expect(listFrom).toEqual([
        null,
        null,
        { test: 'three' },
        { test: 'two' },
        { test: 'one' },
      ])

      const listFromTo = []
      for await (const data of reader.createBackwardsIterator(3, 1)) {
        listFromTo.push(data)
      }
      expect(listFromTo).toEqual([null, { test: 'three' }, { test: 'two' }])
    })

    it('DataListWriter has a getID() method', async () => {
      const config = createConfig()
      const reader = new DataListReader(config)
      const writer = new DataListWriter(config)

      await writer.push({ test: 'one' })
      await writer.push({ test: 'two' })
      await writer.push({ test: 'three' })

      const id = writer.getID()
      expect(id.time).toBe(writer.length - 1)

      const data = await reader.load(id.time)
      expect(data).toEqual({ test: 'three' })
    })
  })
})
