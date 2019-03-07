// @flow

import type Bzz, {
  FeedParams,
  FetchOptions,
  UploadOptions,
} from '@erebos/api-bzz-base'
import type { hexValue } from '@erebos/hex'
import type { Observable } from 'rxjs'
import { flatMap } from 'rxjs/operators'

export const PROTOCOL = 'feedlinks'
export const VERSION = 1

type JSONValue =
  | null
  | boolean
  | number
  | string
  | Array<JSONValue>
  | { [key: string]: JSONValue }

export type PartialChapter<T = JSONValue> = {
  protocol: 'feedlinks', // TODO: rename
  version: 1,
  timestamp: number,
  references?: ?Array<string>,
  previous?: ?string,
  type: string,
  author: string,
  content: T,
  signature?: string,
}

export type Chapter<T = JSONValue> = PartialChapter<T> & { id: string }

export type DecodeChapter<T> = (res: *) => Promise<Chapter<T>>
export type EncodeChapter<T> = (
  chapter: PartialChapter<T>,
) => Promise<string | Buffer>

export type ChapterUploadOptions<T: *> = UploadOptions & {
  encode?: ?EncodeChapter<T>,
}

export type ChapterLoadOptions<T: *> = FetchOptions & {
  decode?: ?DecodeChapter<T>,
}

export type ChapterLiveOptions<T: *> = ChapterLoadOptions<T> & {
  interval: number,
}

const CHAPTER_DEFAULTS = {
  protocol: PROTOCOL,
  version: VERSION,
  type: 'application/json',
}

export const createChapter = <T>(
  chapter: $Shape<PartialChapter<T>>,
): PartialChapter<T> => ({
  ...CHAPTER_DEFAULTS,
  timestamp: Date.now(),
  ...chapter,
})

const createChapterFactory = (defaults: $Shape<PartialChapter<any>>) => {
  const allDefaults = { ...CHAPTER_DEFAULTS, ...defaults }
  return <T>(chapter: $Shape<PartialChapter<T>>): PartialChapter<T> => ({
    ...allDefaults,
    timestamp: Date.now(),
    ...chapter,
  })
}

export const validateChapter = <T: Object>(chapter: T): T => {
  if (chapter.protocol !== PROTOCOL || chapter.version !== VERSION) {
    throw new Error('Unsupported payload')
  }
  return chapter
}

// Should signature support be part of a future release? maybe just adding a test case using encode and decode?

const defaultDecode: DecodeChapter<*> = async (res: *) => {
  return validateChapter(await res.json())
}

const defaultEncode: EncodeChapter<*> = async (chapter: Object) => {
  return JSON.stringify(chapter)
}

type TimelineConfig = {
  bzz: Bzz,
  decode?: ?DecodeChapter<*>,
  encode?: ?EncodeChapter<*>,
}

export default class Timeline {
  _bzz: Bzz
  _decode: DecodeChapter<any>
  _encode: EncodeChapter<any>

  constructor(config: TimelineConfig) {
    this._bzz = config.bzz
    this._decode = config.decode || defaultDecode
    this._encode = config.encode || defaultEncode
  }

  async _decodeWith<T>(
    res: *,
    options: ChapterLoadOptions<T>,
  ): Promise<Chapter<T>> {
    const decode = options.decode || this._decode
    return await decode(res)
  }

  async _encodeWith<T>(
    chapter: PartialChapter<T>,
    options: ChapterUploadOptions<T>,
  ): Promise<string | Buffer> {
    const encode = options.encode || this._encode
    return await encode(chapter)
  }

  async download<T>(
    hash: string,
    options?: ChapterLoadOptions<T> = {},
  ): Promise<Chapter<T>> {
    const res = await this._bzz.download(hash, { mode: 'raw' })
    const chapter = await this._decodeWith<T>(res, options)
    chapter.id = hash
    return chapter
  }

  async upload<T>(
    chapter: PartialChapter<T>,
    options?: ChapterUploadOptions<T> = {},
  ): Promise<hexValue> {
    const encoded = await this._encodeWith<T>(chapter, options)
    return await this._bzz.uploadFile(encoded, {
      ...options,
      mode: 'raw',
    })
  }

  async loadChapterID(
    hashOrParams: string | FeedParams,
    options?: FetchOptions = {},
  ): Promise<?string> {
    try {
      return await this._bzz.getFeedValue(hashOrParams, {
        ...options,
        mode: 'content-hash',
      })
    } catch (err) {
      if (err.status === 404) {
        return null
      } else {
        throw err
      }
    }
  }

  async loadChapter<T>(
    hashOrParams: string | FeedParams,
    options?: ChapterLoadOptions<T> = {},
  ): Promise<?Chapter<T>> {
    const id = await this.loadChapterID(hashOrParams, options)
    if (id == null) {
      return null
    }
    const chapter = await this.download<T>(id, options)
    chapter.id = id
    return chapter
  }

  async updateChapterID(
    hashOrParams: string | FeedParams,
    chapterID: string,
    options?: FetchOptions,
    signParams?: any,
  ): Promise<void> {
    await this._bzz.updateFeedValue(
      hashOrParams,
      `0x${chapterID}`,
      options,
      signParams,
    )
  }

  async addChapter<T>(
    hashOrParams: string | FeedParams,
    chapter: PartialChapter<T>,
    options?: ChapterUploadOptions<T> = {},
    signParams?: any,
  ): Promise<hexValue> {
    const [chapterID, feedMeta] = await Promise.all([
      this.upload<T>(chapter, options),
      this._bzz.getFeedMetadata(hashOrParams),
    ])
    await this._bzz.postFeedValue(
      feedMeta,
      `0x${chapterID}`,
      { headers: options.headers, timeout: options.timeout },
      signParams,
    )
    return chapterID
  }

  async createUpdater<T>(
    hashOrParams: string | FeedParams,
    chapterDefaults?: $Shape<PartialChapter<T>> = {},
    options?: ChapterUploadOptions<T> = {},
    signParams?: any,
  ) {
    let previous = await this.loadChapterID(hashOrParams)
    const create = createChapterFactory(chapterDefaults)

    return async (
      partialChapter: $Shape<PartialChapter<T>>,
    ): Promise<Chapter<T>> => {
      const chapter = create<T>({ ...partialChapter, previous })
      previous = await this.addChapter(
        hashOrParams,
        chapter,
        options,
        signParams,
      )
      return { ...chapter, id: previous }
    }
  }

  createIterator<T>(
    initialID: string,
    options?: ChapterLoadOptions<T> = {},
  ): AsyncIterator<Chapter<T>> {
    let nextID = initialID
    // $FlowFixMe: AsyncIterator
    return {
      // $FlowFixMe: Flow doesn't support symbols as Object keys
      [Symbol.asyncIterator]() {
        return this
      },
      next: async () => {
        if (nextID == null) {
          return { done: true, value: undefined }
        }
        const chapter = await this.download<T>(nextID, options)
        nextID = chapter.previous
        return { done: false, value: chapter }
      },
    }
  }

  async createSlice<T>(
    newestID: string, // inclusive
    oldestID: string, // exclusive
    options?: ChapterLoadOptions<T> = {},
  ): Promise<Array<Chapter<T>>> {
    const slice = []
    for await (const chapter of this.createIterator<T>(newestID, options)) {
      slice.push(chapter)
      if (chapter.previous === oldestID) {
        break
      }
    }
    return slice
  }

  live<T>(
    hashOrParams: string | FeedParams,
    options: ChapterLiveOptions<T>,
  ): Observable<Array<Chapter<T>>> {
    let previousKnow
    return this._bzz
      .pollFeedValue(hashOrParams, {
        ...options,
        mode: 'content-hash',
        whenEmpty: 'ignore',
        contentChangedOnly: true,
      })
      .pipe(
        flatMap(async id => {
          let chapters
          const chapter = await this.download<T>(id, options)

          if (
            previousKnow === null ||
            chapter.previous == null ||
            chapter.previous === previousKnow
          ) {
            // Single chapter to push
            chapters = [chapter]
          } else {
            // There has been more than one update during the polling interval
            const slice = await this.createSlice<T>(
              chapter.previous,
              previousKnow,
              options,
            )
            chapters = slice.reverse().concat(chapter)
          }

          previousKnow = id
          return chapters
        }),
      )
  }
}
