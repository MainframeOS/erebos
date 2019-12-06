import {
  MAX_CHUNK_BYTE_LENGTH,
  ChunkListReaderConfig,
  ChunkListReader,
  ChunkListWriter,
  DataListReader,
  DataListWriter,
} from '@erebos/feed-list'
import { Bzz } from '@erebos/api-bzz-node'
import { pubKeyToAddress } from '@erebos/keccak256'
import { createKeyPair, sign } from '@erebos/secp256k1'

describe('feed-list', () => {
  function createConfig(): ChunkListReaderConfig {
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
      expect(iteratorFromIndex).toHaveLength(4)
    })

    it('supports backwards iteration', async () => {
      const config = createConfig()
      const reader = new ChunkListReader(config)
      const writer = new ChunkListWriter(config)

      await writer.push('one')
      await writer.push('two')
      await writer.push('three')
      expect(writer).toHaveLength(3)

      const data = []
      for await (const chunk of reader.createBackwardsIterator(4)) {
        data.push(chunk === null ? null : chunk.toString())
      }
      expect(data).toEqual([null, null, 'three', 'two', 'one'])
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
      expect(iteratorFromIndex).toHaveLength(4)
    })

    it('supports backwards iteration', async () => {
      const config = createConfig()
      const reader = new DataListReader(config)
      const writer = new DataListWriter(config)

      await writer.push({ test: 'one' })
      await writer.push({ test: 'two' })
      await writer.push({ test: 'three' })
      expect(writer).toHaveLength(3)

      const list = []
      for await (const data of reader.createBackwardsIterator(4)) {
        list.push(data)
      }
      expect(list).toEqual([
        null,
        null,
        { test: 'three' },
        { test: 'two' },
        { test: 'one' },
      ])
    })
  })
})
