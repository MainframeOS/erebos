import { Readable } from 'stream'
import {
  FEED_MAX_DATA_LENGTH,
  BaseBzz,
  BaseResponse,
  FeedID,
  FeedParams,
  FetchOptions,
} from '@erebos/api-bzz-base'
import { createHex, Hex, hexInput } from '@erebos/hex'

export const MAX_CHUNK_BYTE_LENGTH = FEED_MAX_DATA_LENGTH
// Hex value is a hex string (= byte length x 2) prefixed by `0x`
export const MAX_CHUNK_VALUE_LENGTH = MAX_CHUNK_BYTE_LENGTH * 2 + 2

export interface ForwardsChunkIterator<T> extends AsyncIterator<T> {
  length: number
}

export interface ChunkListReaderConfig<
  Bzz extends BaseBzz<BaseResponse, Readable> = BaseBzz<BaseResponse, Readable>
> {
  bzz: Bzz
  feed: FeedID | FeedParams
  fetchOptions?: FetchOptions
}

export class ChunkListReader<
  Bzz extends BaseBzz<BaseResponse, Readable> = BaseBzz<BaseResponse, Readable>
> {
  public bzz: Bzz
  public fetchOptions: FetchOptions
  protected id: FeedID

  constructor(config: ChunkListReaderConfig<Bzz>) {
    this.bzz = config.bzz
    this.fetchOptions = config.fetchOptions || {}
    this.id =
      config.feed instanceof FeedID ? config.feed : new FeedID(config.feed)
  }

  public async load(index: number): Promise<Hex | null> {
    const id = this.id.clone()
    id.time = index

    try {
      const data = await this.bzz.getRawFeedChunkData(id, this.fetchOptions)
      return createHex(Buffer.from(data))
    } catch (err) {
      if (err.status === 404) {
        return null
      }
      throw err
    }
  }

  public createBackwardsIterator(
    initialIndex: number,
  ): AsyncIterator<Hex | null> {
    const id = this.id.clone()
    id.time = initialIndex
    return {
      // @ts-ignore
      [Symbol.asyncIterator]() {
        return this
      },
      next: async (): Promise<IteratorResult<Hex | null>> => {
        if (id.time === -1) {
          return { done: true, value: undefined }
        }
        const value = await this.load(id.time)
        // eslint-disable-next-line require-atomic-updates
        id.time -= 1
        return { done: false, value }
      },
    }
  }

  public createForwardsIterator(initialIndex = 0): ForwardsChunkIterator<Hex> {
    const id = this.id.clone()
    id.time = initialIndex
    return {
      // @ts-ignore
      [Symbol.asyncIterator]() {
        return this
      },
      get length(): number {
        return id.time
      },
      next: async (): Promise<IteratorResult<Hex>> => {
        const value = await this.load(id.time)
        if (value === null) {
          return { done: true, value: undefined }
        }
        // eslint-disable-next-line require-atomic-updates
        id.time += 1
        return { done: false, value }
      },
    }
  }
}

export interface ChunkListWriterConfig<
  Bzz extends BaseBzz<BaseResponse, Readable> = BaseBzz<BaseResponse, Readable>
> extends ChunkListReaderConfig<Bzz> {
  signParams?: any
}

export class ChunkListWriter<
  Bzz extends BaseBzz<BaseResponse, Readable> = BaseBzz<BaseResponse, Readable>
> extends ChunkListReader<Bzz> {
  protected signParams?: any

  constructor(config: ChunkListWriterConfig<Bzz>) {
    super(config)
    this.signParams = config.signParams
  }

  public get length(): number {
    return this.id.time
  }

  public async push(data: hexInput): Promise<void> {
    const chunk = createHex(data)
    if (chunk.value.length > MAX_CHUNK_VALUE_LENGTH) {
      throw new Error(
        `Chunk exceeds max length of ${MAX_CHUNK_BYTE_LENGTH} bytes`,
      )
    }
    await this.bzz.postFeedChunk(
      this.id,
      chunk,
      this.fetchOptions,
      this.signParams,
    )
    this.id.time += 1
  }
}

export class DataListReader<
  T = any,
  Bzz extends BaseBzz<BaseResponse, Readable> = BaseBzz<BaseResponse, Readable>
> {
  protected chunkList: ChunkListReader<Bzz>

  constructor(config: ChunkListReaderConfig<Bzz>) {
    this.chunkList = new ChunkListReader(config)
  }

  protected async downloadData(hex: Hex): Promise<T> {
    const res = await this.chunkList.bzz.download(hex.value.slice(2), {
      ...this.chunkList.fetchOptions,
      mode: 'raw',
    })
    return await res.json()
  }

  public async load(index: number): Promise<T | null> {
    const hex = await this.chunkList.load(index)
    return hex ? await this.downloadData(hex) : null
  }

  public createBackwardsIterator(
    initialIndex: number,
  ): AsyncIterator<T | null> {
    const iterator = this.chunkList.createBackwardsIterator(initialIndex)
    return {
      // @ts-ignore
      [Symbol.asyncIterator]() {
        return this
      },
      next: async (): Promise<IteratorResult<T | null>> => {
        const res = await iterator.next()
        if (res.done) {
          return { done: true, value: undefined }
        }
        if (res.value === null) {
          return { done: false, value: null }
        }
        const value = await this.downloadData(res.value)
        return { done: false, value }
      },
    }
  }

  public createForwardsIterator(initialIndex = 0): ForwardsChunkIterator<T> {
    const iterator = this.chunkList.createForwardsIterator(initialIndex)
    return {
      // @ts-ignore
      [Symbol.asyncIterator]() {
        return this
      },
      get length(): number {
        return iterator.length
      },
      next: async (): Promise<IteratorResult<T>> => {
        const res = await iterator.next()
        return res.done
          ? { done: true, value: undefined }
          : { done: false, value: await this.downloadData(res.value) }
      },
    }
  }
}

export class DataListWriter<
  T = any,
  Bzz extends BaseBzz<BaseResponse, Readable> = BaseBzz<BaseResponse, Readable>
> extends DataListReader<T, Bzz> {
  protected chunkList: ChunkListWriter<Bzz>

  constructor(config: ChunkListWriterConfig<Bzz>) {
    super(config)
    this.chunkList = new ChunkListWriter<Bzz>(config)
  }

  public get length(): number {
    return this.chunkList.length
  }

  public async push(data: T): Promise<string> {
    const hash = await this.chunkList.bzz.uploadFile(JSON.stringify(data))
    await this.chunkList.push(`0x${hash}`)
    return hash
  }
}
