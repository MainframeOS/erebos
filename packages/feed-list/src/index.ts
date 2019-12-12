import { Readable } from 'stream'
import {
  FEED_MAX_DATA_LENGTH,
  BaseBzz,
  BaseResponse,
  FeedID,
  FeedParams,
  FetchOptions,
} from '@erebos/api-bzz-base'
import { Hex, hexInput } from '@erebos/hex'

export const MAX_CHUNK_BYTE_LENGTH = FEED_MAX_DATA_LENGTH
// Hex value is a hex string (= byte length x 2) prefixed by `0x`
export const MAX_CHUNK_VALUE_LENGTH = MAX_CHUNK_BYTE_LENGTH * 2 + 2

export interface ForwardsChunkIterator<T> extends AsyncIterator<T> {
  length: number
}

export interface ListReaderConfig<
  Bzz extends BaseBzz<BaseResponse, Readable> = BaseBzz<BaseResponse, Readable>
> {
  bzz: Bzz
  feed: FeedID | FeedParams
  fetchOptions?: FetchOptions
}

export interface ListWriterConfig<
  Bzz extends BaseBzz<BaseResponse, Readable> = BaseBzz<BaseResponse, Readable>
> extends ListReaderConfig<Bzz> {
  signParams?: any
}

export class ChunkListReader<
  Bzz extends BaseBzz<BaseResponse, Readable> = BaseBzz<BaseResponse, Readable>
> {
  public bzz: Bzz
  public fetchOptions: FetchOptions
  protected id: FeedID

  constructor(config: ListReaderConfig<Bzz>) {
    this.bzz = config.bzz
    this.fetchOptions = config.fetchOptions || {}
    this.id =
      config.feed instanceof FeedID
        ? config.feed
        : new FeedID({
            ...config.feed,
            time: config.feed.time == null ? -1 : config.feed.time,
          })
  }

  public async load(index: number): Promise<Hex | null> {
    const id = this.id.clone()
    id.time = index

    try {
      const data = await this.bzz.getRawFeedChunkData(id, this.fetchOptions)
      return Hex.from(Buffer.from(data))
    } catch (err) {
      if (err.status === 404) {
        return null
      }
      throw err
    }
  }

  public createBackwardsIterator(
    maxIndex: number,
    minIndex = 0,
  ): AsyncIterator<Hex | null> {
    const id = this.id.clone()
    id.time = maxIndex

    return {
      // @ts-ignore
      [Symbol.asyncIterator]() {
        return this
      },
      next: async (): Promise<IteratorResult<Hex | null>> => {
        if (id.time === minIndex - 1) {
          return { done: true, value: undefined }
        }
        const value = await this.load(id.time)
        // eslint-disable-next-line require-atomic-updates
        id.time -= 1
        return { done: false, value }
      },
    }
  }

  public createForwardsIterator(
    minIndex = 0,
    maxIndex?: number,
  ): ForwardsChunkIterator<Hex> {
    const doneIndex = maxIndex ? maxIndex + 1 : Number.MAX_SAFE_INTEGER
    const id = this.id.clone()
    id.time = minIndex

    return {
      // @ts-ignore
      [Symbol.asyncIterator]() {
        return this
      },
      get length(): number {
        return id.time - minIndex
      },
      next: async (): Promise<IteratorResult<Hex>> => {
        if (id.time === doneIndex) {
          return { done: true, value: undefined }
        }
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

export class ChunkListWriter<
  Bzz extends BaseBzz<BaseResponse, Readable> = BaseBzz<BaseResponse, Readable>
> extends ChunkListReader<Bzz> {
  protected signParams?: any

  constructor(config: ListWriterConfig<Bzz>) {
    super(config)
    this.signParams = config.signParams
  }

  public get length(): number {
    return this.id.time + 1
  }

  public getID(): FeedID {
    return this.id.clone()
  }

  public async push(data: hexInput): Promise<void> {
    const chunk = Hex.from(data)
    if (chunk.value.length > MAX_CHUNK_VALUE_LENGTH) {
      throw new Error(
        `Chunk exceeds max length of ${MAX_CHUNK_BYTE_LENGTH} bytes`,
      )
    }

    const id = this.getID()
    id.time += 1

    await this.bzz.postFeedChunk(id, chunk, this.fetchOptions, this.signParams)
    this.id = id
  }
}

export class DataListReader<
  T = any,
  Bzz extends BaseBzz<BaseResponse, Readable> = BaseBzz<BaseResponse, Readable>
> {
  protected chunkList: ChunkListReader<Bzz>

  constructor(config: ListReaderConfig<Bzz>) {
    this.chunkList = new ChunkListReader(config)
  }

  protected async downloadData(hex: Hex): Promise<T> {
    return await this.chunkList.bzz.downloadData(
      hex.value.slice(2),
      this.chunkList.fetchOptions,
    )
  }

  public async load(index: number): Promise<T | null> {
    const hex = await this.chunkList.load(index)
    return hex ? await this.downloadData(hex) : null
  }

  public createBackwardsIterator(
    maxIndex: number,
    minIndex?: number,
  ): AsyncIterator<T | null> {
    const iterator = this.chunkList.createBackwardsIterator(maxIndex, minIndex)
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

  public createForwardsIterator(
    minIndex?: number,
    maxIndex?: number,
  ): ForwardsChunkIterator<T> {
    const iterator = this.chunkList.createForwardsIterator(minIndex, maxIndex)
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

  constructor(config: ListWriterConfig<Bzz>) {
    super(config)
    this.chunkList = new ChunkListWriter<Bzz>(config)
  }

  public get length(): number {
    return this.chunkList.length
  }

  public getID(): FeedID {
    return this.chunkList.getID()
  }

  public async push(data: T): Promise<string> {
    const hash = await this.chunkList.bzz.uploadData<T>(data)
    await this.chunkList.push(`0x${hash}`)
    return hash
  }
}
