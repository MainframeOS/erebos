// @flow

import type Bzz, {
  FeedParams,
  FetchOptions,
  UploadOptions,
} from '@erebos/api-bzz-base'
import type { hexValue } from '@erebos/hex'
import type { Observable } from 'rxjs'
import { flatMap } from 'rxjs/operators'

export const PROTOCOL = 'timeline'
export const VERSION = 1

type JSONValue =
  | null
  | boolean
  | number
  | string
  | Array<JSONValue>
  | { [key: string]: JSONValue }

export type PartialChapter<T = JSONValue> = {
  protocol: 'timeline',
  version: 1,
  timestamp: number,
  author: string,
  type: string,
  content: T,
  previous?: ?string,
  references?: ?Array<string>,
  signature?: string,
}

export type Chapter<T = JSONValue> = PartialChapter<T> & { id: string }

export type DecodeChapter<T> = (res: *) => Promise<Chapter<T>>
export type EncodeChapter<T> = (
  chapter: PartialChapter<T>,
) => Promise<string | Buffer>

export type LiveOptions = FetchOptions & {
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

export type TimelineConfig = {
  bzz: Bzz,
  feed: string | FeedParams,
  decode?: ?DecodeChapter<*>,
  encode?: ?EncodeChapter<*>,
  signParams?: any,
}

export class Timeline {
  _bzz: Bzz
  _decode: DecodeChapter<any>
  _encode: EncodeChapter<any>
  _feed: string | FeedParams
  _signParams: ?any

  constructor(config: TimelineConfig) {
    this._bzz = config.bzz
    this._decode = config.decode || defaultDecode
    this._encode = config.encode || defaultEncode
    this._feed = config.feed
    this._signParams = config.signParams
  }

  async download<T>(
    id: string,
    options?: FetchOptions = {},
  ): Promise<Chapter<T>> {
    const res = await this._bzz.download(id, { ...options, mode: 'raw' })
    const chapter = await this._decode(res)
    chapter.id = id
    return chapter
  }

  async upload<T>(
    chapter: PartialChapter<T>,
    options?: UploadOptions = {},
  ): Promise<hexValue> {
    const encoded = await this._encode(chapter)
    return await this._bzz.uploadFile(encoded, options)
  }

  async getChapterID(options?: FetchOptions = {}): Promise<?hexValue> {
    try {
      return await this._bzz.getFeedValue(this._feed, {
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

  async loadChapter<T>(options?: FetchOptions = {}): Promise<?Chapter<T>> {
    const id = await this.getChapterID(options)
    if (id == null) {
      return null
    }
    return await this.download<T>(id, options)
  }

  async updateChapterID(
    chapterID: string,
    options?: FetchOptions,
  ): Promise<void> {
    await this._bzz.updateFeedValue(
      this._feed,
      `0x${chapterID}`,
      options,
      this._signParams,
    )
  }

  async addChapter<T>(
    chapter: PartialChapter<T>,
    options?: UploadOptions = {},
  ): Promise<hexValue> {
    const [chapterID, feedMeta] = await Promise.all([
      this.upload<T>(chapter, options),
      this._bzz.getFeedMetadata(this._feed),
    ])
    await this._bzz.postFeedValue(
      feedMeta,
      `0x${chapterID}`,
      { headers: options.headers, timeout: options.timeout },
      this._signParams,
    )
    return chapterID
  }

  createUpdater<T>(
    chapterDefaults?: $Shape<PartialChapter<T>> = {},
    options?: UploadOptions = {},
  ) {
    let previous = null
    let previousPromise = this.getChapterID(options)
    const create = createChapterFactory(chapterDefaults)

    return async (
      partialChapter: $Shape<PartialChapter<T>>,
    ): Promise<Chapter<T>> => {
      if (previous === null && previousPromise !== null) {
        previous = await previousPromise
        previousPromise = null
      }
      const chapter = create<T>({ ...partialChapter, previous })
      previous = await this.addChapter(chapter, options)
      return { ...chapter, id: previous }
    }
  }

  createIterator<T>(
    initialID?: string,
    options?: FetchOptions = {},
  ): AsyncIterator<Chapter<T>> {
    let unitialLoaded = false
    let nextID = initialID
    // $FlowFixMe: AsyncIterator
    return {
      // $FlowFixMe: Flow doesn't support symbols as Object keys
      [Symbol.asyncIterator]() {
        return this
      },
      next: async () => {
        if (initialID == null && !unitialLoaded) {
          nextID = await this.getChapterID(options)
          unitialLoaded = true
        }
        if (nextID == null) {
          return { done: true, value: undefined }
        }
        const chapter = await this.download<T>(nextID, options)
        nextID = chapter.previous
        return { done: false, value: chapter }
      },
    }
  }

  async loadChapters<T>(
    newestID: string, // inclusive
    oldestID: string, // exclusive
    options?: FetchOptions = {},
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

  live<T>(options: LiveOptions): Observable<Array<Chapter<T>>> {
    let previousKnow
    return this._bzz
      .pollFeedValue(this._feed, {
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
            const slice = await this.loadChapters<T>(
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
