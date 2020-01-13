import { Response, toSwarmHash } from '@erebos/bzz'
import {
  FEED_MAX_DATA_LENGTH,
  BzzFeed,
  FeedID,
  FeedParams,
  FetchOptions,
} from '@erebos/bzz-feed'
import { Hex } from '@erebos/hex'

export const MAX_CHUNK_BYTE_LENGTH = FEED_MAX_DATA_LENGTH
// Hex value is a hex string (= byte length x 2) prefixed by `0x`
export const MAX_CHUNK_VALUE_LENGTH = MAX_CHUNK_BYTE_LENGTH * 2 + 2

export interface ForwardsChunkIterator<T> extends AsyncIterableIterator<T> {
  length: number
}

type Res = Response<any>
type Bzz = BzzFeed<any, Res>

export interface ListReaderConfig<T = any, B extends Bzz = Bzz> {
  bzz: B
  feed: FeedID | FeedParams
  fetchOptions?: FetchOptions
}

export interface ListWriterConfig<T = any, B extends Bzz = Bzz>
  extends ListReaderConfig<T, B> {
  signParams?: any
}

export class ChunkListReader<T = Hex, B extends Bzz = Bzz> {
  protected readonly bzzFeed: B
  protected readonly fetchOptions: FetchOptions

  protected id: FeedID

  constructor(config: ListReaderConfig<T, B>) {
    this.bzzFeed = config.bzz
    this.fetchOptions = config.fetchOptions || {}
    this.id =
      config.feed instanceof FeedID
        ? config.feed
        : new FeedID({
            ...config.feed,
            time: config.feed.time == null ? -1 : config.feed.time,
          })
  }

  public getID(): FeedID {
    return this.id.clone()
  }

  public async read(data: ArrayBuffer): Promise<T> {
    return Promise.resolve((Hex.from(Buffer.from(data)) as any) as T)
  }

  public async load(index: number): Promise<T | null> {
    const id = this.getID()
    id.time = index

    try {
      const data = await this.bzzFeed.getRawChunkData(id, this.fetchOptions)
      return await this.read(data)
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
  ): AsyncIterableIterator<T | null> {
    const id = this.getID()
    id.time = maxIndex

    return {
      [Symbol.asyncIterator]() {
        return this
      },
      next: async (): Promise<IteratorResult<T | null>> => {
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
  ): ForwardsChunkIterator<T> {
    const doneIndex = maxIndex ? maxIndex + 1 : Number.MAX_SAFE_INTEGER
    const id = this.id.clone()
    id.time = minIndex

    return {
      [Symbol.asyncIterator]() {
        return this
      },
      get length(): number {
        return id.time - minIndex
      },
      next: async (): Promise<IteratorResult<T>> => {
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
  T = Hex,
  B extends Bzz = Bzz
> extends ChunkListReader<T, B> {
  protected readonly signParams?: any

  constructor(config: ListWriterConfig<T, B>) {
    super(config)
    this.signParams = config.signParams
  }

  public get length(): number {
    return this.id.time + 1
  }

  public async write(data: T): Promise<Hex> {
    return Promise.resolve(Hex.from(data))
  }

  public async push(data: T): Promise<void> {
    const chunk = await this.write(data)
    if (chunk.value.length > MAX_CHUNK_VALUE_LENGTH) {
      throw new Error(
        `Chunk exceeds max length of ${MAX_CHUNK_BYTE_LENGTH} bytes`,
      )
    }

    const id = this.getID()
    id.time += 1

    await this.bzzFeed.postChunk(id, chunk, this.fetchOptions, this.signParams)
    this.id = id
  }
}

export class DataListReader<
  T = any,
  B extends Bzz = Bzz
> extends ChunkListReader<T, B> {
  public async read(chunk: ArrayBuffer): Promise<T> {
    return await this.bzzFeed.bzz.downloadData(
      toSwarmHash(chunk),
      this.fetchOptions,
    )
  }
}

export class DataListWriter<T = any, B extends Bzz = Bzz>
  extends ChunkListWriter<T, B>
  implements DataListReader<T, B> {
  public async read(chunk: ArrayBuffer): Promise<T> {
    return await this.bzzFeed.bzz.downloadData(
      toSwarmHash(chunk),
      this.fetchOptions,
    )
  }

  public async write(data: T): Promise<Hex> {
    const hash = await this.bzzFeed.bzz.uploadData<T>(data)
    return Hex.from(`0x${hash}`)
  }
}
