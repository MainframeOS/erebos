// @flow

import type Bzz, {
  FeedParams,
  FetchOptions,
  UploadOptions,
} from '@erebos/api-bzz-base'
import type { hexValue } from '@erebos/hex'
import { Observable } from 'rxjs'
import { flatMap } from 'rxjs/operators'
import semver from 'semver'

export const PROTOCOL = 'timeline'
export const VERSION = '1.0.0'
export const VERSION_RANGE = '^1.0.0'

type JSONValue =
  | null
  | boolean
  | number
  | string
  | Array<JSONValue>
  | { [key: string]: JSONValue }

export type PartialChapter<T = JSONValue> = {
  protocol: string,
  version: string,
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

export type PollOptions = FetchOptions & {
  interval: number,
}

export type LiveOptions = PollOptions & {
  previous?: string,
  timestamp?: number,
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
  if (chapter.protocol == null || chapter.version == null) {
    throw new Error('Invalid payload')
  }
  if (chapter.protocol !== PROTOCOL) {
    throw new Error('Unsupported protocol')
  }
  if (!semver.satisfies(chapter.version, VERSION_RANGE)) {
    throw new Error('Unsupported protocol version')
  }
  return chapter
}

const defaultDecode = async (res: *) => {
  return validateChapter(await res.json())
}

const defaultEncode = async (chapter: Object) => {
  return JSON.stringify(chapter)
}

export type TimelineConfig<T = JSONValue> = {
  bzz: Bzz,
  feed: string | FeedParams,
  decode?: ?DecodeChapter<T>,
  encode?: ?EncodeChapter<T>,
  signParams?: any,
}

export class Timeline<T> {
  _bzz: Bzz
  _decode: DecodeChapter<T>
  _encode: EncodeChapter<T>
  _feed: string | FeedParams
  _signParams: ?any

  constructor(config: TimelineConfig<T>) {
    this._bzz = config.bzz
    this._decode = config.decode || defaultDecode
    this._encode = config.encode || defaultEncode
    this._feed = config.feed
    this._signParams = config.signParams
  }

  async getChapter(
    id: string,
    options?: FetchOptions = {},
  ): Promise<Chapter<T>> {
    const res = await this._bzz.download(id, { ...options, mode: 'raw' })
    const chapter = await this._decode(res)
    chapter.id = id
    return chapter
  }

  async postChapter(
    chapter: PartialChapter<T>,
    options?: UploadOptions = {},
  ): Promise<hexValue> {
    const encoded = await this._encode(chapter)
    return await this._bzz.uploadFile(encoded, options)
  }

  async getLatestChapterID(
    options?: FetchOptions = {},
  ): Promise<hexValue | null> {
    try {
      return await this._bzz.getFeedContentHash(this._feed, options)
    } catch (err) {
      if (err.status === 404) {
        return null
      } else {
        throw err
      }
    }
  }

  async getLatestChapter(
    options?: FetchOptions = {},
  ): Promise<Chapter<T> | null> {
    const id = await this.getLatestChapterID(options)
    if (id == null) {
      return null
    }
    return await this.getChapter(id, options)
  }

  async setLatestChapterID(
    chapterID: string,
    options?: FetchOptions,
  ): Promise<void> {
    await this._bzz.setFeedContentHash(
      this._feed,
      chapterID,
      options,
      this._signParams,
    )
  }

  async setLatestChapter(
    chapter: PartialChapter<T>,
    options?: UploadOptions = {},
  ): Promise<hexValue> {
    const [chapterID, feedMeta] = await Promise.all([
      this.postChapter(chapter, options),
      this._bzz.getFeedMetadata(this._feed),
    ])
    await this._bzz.postFeedChunk(
      feedMeta,
      `0x${chapterID}`,
      { headers: options.headers, timeout: options.timeout },
      this._signParams,
    )
    return chapterID
  }

  async addChapter(
    chapter: PartialChapter<T>,
    options?: UploadOptions = {},
  ): Promise<Chapter<T>> {
    if (typeof chapter.previous === 'undefined') {
      chapter.previous = await this.getLatestChapterID(options)
    }
    const id = await this.setLatestChapter(chapter)
    return { ...chapter, id }
  }

  createAddChapter(
    chapterDefaults?: $Shape<PartialChapter<T>> = {},
    options?: UploadOptions = {},
  ) {
    let previous = null
    let previousPromise = this.getLatestChapterID(options)
    const create = createChapterFactory(chapterDefaults)

    return async (
      partialChapter: $Shape<PartialChapter<T>>,
    ): Promise<Chapter<T>> => {
      if (previous === null && previousPromise !== null) {
        previous = await previousPromise
        previousPromise = null
      }
      const chapter = create({ ...partialChapter, previous })
      previous = await this.setLatestChapter(chapter, options)
      return { ...chapter, id: previous }
    }
  }

  createIterator(
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
          nextID = await this.getLatestChapterID(options)
          unitialLoaded = true
        }
        if (nextID == null) {
          return { done: true, value: undefined }
        }
        const chapter = await this.getChapter(nextID, options)
        nextID = chapter.previous
        return { done: false, value: chapter }
      },
    }
  }

  createLoader(
    newestID: string, // inclusive
    oldestID: string, // exclusive
    options?: FetchOptions = {},
  ): Observable<Chapter<T>> {
    return Observable.create(async subscriber => {
      try {
        for await (const chapter of this.createIterator(newestID, options)) {
          subscriber.next(chapter)
          if (chapter.previous === oldestID) {
            subscriber.complete()
            break
          }
        }
      } catch (err) {
        subscriber.error(err)
      }
    })
  }

  async getChapters(
    newestID: string, // inclusive
    oldestID: string, // exclusive
    options?: FetchOptions = {},
  ): Promise<Array<Chapter<T>>> {
    const chapters = []
    for await (const chapter of this.createIterator(newestID, options)) {
      chapters.push(chapter)
      if (chapter.previous === oldestID) {
        break
      }
    }
    return chapters
  }

  pollLatestChapter(options: PollOptions): Observable<Chapter<T>> {
    const downloadOptions = {
      headers: options.headers,
      mode: 'raw',
    }
    return this._bzz
      .pollFeedContentHash(this._feed, {
        whenEmpty: 'ignore',
        changedOnly: true,
        ...options,
      })
      .pipe(
        flatMap(id => {
          return id === null ? [] : this.getChapter(id, downloadOptions)
        }),
      )
  }

  live(options: LiveOptions): Observable<Array<Chapter<T>>> {
    let minTimestamp = options.timestamp || Date.now()
    let previousID = options.previous || null

    return this.pollLatestChapter(options).pipe(
      flatMap(async chapter => {
        let chapters

        if (chapter.timestamp < minTimestamp && previousID === null) {
          // Ignore chapter older than minimum timestamp
          return []
        }

        if (
          previousID === null ||
          chapter.previous == null ||
          chapter.previous === previousID
        ) {
          // Single chapter to push
          chapters = [chapter]
        } else {
          // There has been more than one update during the polling interval
          const slice = await this.getChapters(
            chapter.previous,
            previousID,
            options,
          )
          chapters = slice.reverse().concat(chapter)
        }

        minTimestamp = chapter.timestamp
        previousID = chapter.id

        return chapters
      }),
    )
  }
}

export const createTimeline = <T>(config: TimelineConfig<T>): Timeline<T> => {
  return new Timeline(config)
}
