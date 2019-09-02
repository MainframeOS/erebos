import {
  BaseBzz,
  BaseResponse,
  FeedParams,
  FetchOptions,
  UploadOptions,
} from '@erebos/api-bzz-base'
import { hexValue } from '@erebos/hex'
import { Observable, Observer } from 'rxjs'
import { flatMap } from 'rxjs/operators'
import semver from 'semver'

export const PROTOCOL = 'timeline'
export const VERSION = '1.0.0'
export const VERSION_RANGE = '^1.0.0'

export interface PartialChapter<T = any> {
  protocol: string
  version: string
  timestamp: number
  author: string
  type: string
  content: T
  previous?: string | null
  references?: Array<string>
  signature?: string
}

export interface Chapter<T = any> extends PartialChapter<T> {
  id: string
}

export type DecodeChapter<T, R extends BaseResponse = BaseResponse> = (
  res: R,
) => Promise<Chapter<T>>
export type EncodeChapter<T> = (
  chapter: PartialChapter<T>,
) => Promise<string | Buffer>

export interface PollOptions extends FetchOptions {
  interval: number
}

export interface LiveOptions extends PollOptions {
  previous?: string
  timestamp?: number
}

const CHAPTER_DEFAULTS = {
  protocol: PROTOCOL,
  version: VERSION,
  type: 'application/json',
}

export function createChapter<T>(
  chapter: Partial<PartialChapter<T>>,
): PartialChapter<T> {
  return {
    ...CHAPTER_DEFAULTS,
    timestamp: Date.now(),
    ...chapter,
  } as PartialChapter<T>
}

function createChapterFactory(
  defaults: Partial<PartialChapter<any>>,
): <T>(chapter: Partial<PartialChapter<T>>) => PartialChapter<T> {
  const allDefaults = { ...CHAPTER_DEFAULTS, ...defaults }
  return function createChapter<T>(
    chapter: Partial<PartialChapter<T>>,
  ): PartialChapter<T> {
    return {
      ...allDefaults,
      timestamp: Date.now(),
      ...chapter,
    } as PartialChapter<T>
  }
}

export interface MaybeChapter extends Record<string, any> {
  protocol?: string
  version?: string
}

export function validateChapter<T extends MaybeChapter>(chapter: T): T {
  if (chapter.protocol == null || chapter.version == null) {
    throw new Error('Invalid payload')
  }
  if (chapter.protocol !== PROTOCOL) {
    throw new Error('Unsupported protocol')
  }
  if (
    semver.valid(chapter.version) === null ||
    !semver.satisfies(chapter.version, VERSION_RANGE)
  ) {
    throw new Error('Unsupported protocol version')
  }
  return chapter
}

async function defaultDecode<
  T extends MaybeChapter,
  R extends BaseResponse = BaseResponse
>(res: R): Promise<T> {
  return validateChapter<T>(await res.json())
}

function defaultEncode(chapter: any): Promise<string> {
  return Promise.resolve(JSON.stringify(chapter))
}

export interface TimelineConfig<
  T = any,
  Bzz extends BaseBzz<BaseResponse> = BaseBzz<BaseResponse>
> {
  bzz: Bzz
  feed: string | FeedParams
  decode?: DecodeChapter<T>
  encode?: EncodeChapter<T>
  signParams?: any
}

export class Timeline<
  T = any,
  Bzz extends BaseBzz<BaseResponse> = BaseBzz<BaseResponse>
> {
  protected bzz: Bzz
  protected decode: DecodeChapter<T>
  protected encode: EncodeChapter<T>
  protected feed: string | FeedParams
  protected signParams: any

  public constructor(config: TimelineConfig<T, Bzz>) {
    this.bzz = config.bzz
    this.decode = config.decode || defaultDecode
    this.encode = config.encode || defaultEncode
    this.feed = config.feed
    this.signParams = config.signParams
  }

  public async getChapter(
    id: string,
    options: FetchOptions = {},
  ): Promise<Chapter<T>> {
    const res = await this.bzz.download(id, { ...options, mode: 'raw' })
    const chapter = await this.decode(res)
    chapter.id = id
    return chapter
  }

  public async postChapter(
    chapter: PartialChapter<T>,
    options: UploadOptions = {},
  ): Promise<hexValue> {
    const encoded = await this.encode(chapter)
    return await this.bzz.uploadFile(encoded, options)
  }

  public async getLatestChapterID(
    options: FetchOptions = {},
  ): Promise<string | null> {
    try {
      return await this.bzz.getFeedContentHash(this.feed, options)
    } catch (err) {
      if (err.status === 404) {
        return null
      } else {
        throw err
      }
    }
  }

  public async getLatestChapter(
    options: FetchOptions = {},
  ): Promise<Chapter<T> | null> {
    const id = await this.getLatestChapterID(options)
    if (id == null) {
      return null
    }
    return await this.getChapter(id, options)
  }

  public async setLatestChapterID(
    chapterID: string,
    options?: FetchOptions,
  ): Promise<void> {
    await this.bzz.setFeedContentHash(
      this.feed,
      chapterID,
      options,
      this.signParams,
    )
  }

  public async setLatestChapter(
    chapter: PartialChapter<T>,
    options: UploadOptions = {},
  ): Promise<hexValue> {
    const [chapterID, feedMeta] = await Promise.all([
      this.postChapter(chapter, options),
      this.bzz.getFeedMetadata(this.feed),
    ])
    await this.bzz.postFeedChunk(
      feedMeta,
      `0x${chapterID}`,
      { headers: options.headers, timeout: options.timeout },
      this.signParams,
    )
    return chapterID
  }

  public async addChapter(
    chapter: PartialChapter<T>,
    options: UploadOptions = {},
  ): Promise<Chapter<T>> {
    if (typeof chapter.previous === 'undefined') {
      // eslint-disable-next-line require-atomic-updates
      chapter.previous = await this.getLatestChapterID(options)
    }
    const id = await this.setLatestChapter(createChapter(chapter))
    return { ...chapter, id }
  }

  public createAddChapter(
    chapterDefaults: Partial<PartialChapter<T>> = {},
    options: UploadOptions = {},
  ): (partialChapter: Partial<PartialChapter<T>>) => Promise<Chapter<T>> {
    let previous: string | null = null
    let previousPromise: null | Promise<
      string | null
    > = this.getLatestChapterID(options)
    const create = createChapterFactory(chapterDefaults)

    return async (
      partialChapter: Partial<PartialChapter<T>>,
    ): Promise<Chapter<T>> => {
      if (previous === null && previousPromise !== null) {
        // eslint-disable-next-line require-atomic-updates
        previous = await previousPromise
        // eslint-disable-next-line require-atomic-updates
        previousPromise = null
      }
      const chapter = create({ ...partialChapter, previous })
      // eslint-disable-next-line require-atomic-updates
      previous = await this.setLatestChapter(chapter, options)
      return { ...chapter, id: previous }
    }
  }

  public createIterator(
    initialID?: string,
    options: FetchOptions = {},
  ): AsyncIterator<Chapter<T>> {
    let initialLoaded = false
    let nextID: string | null | void = initialID
    return {
      // @ts-ignore
      [Symbol.asyncIterator]() {
        return this
      },
      next: async (): Promise<IteratorResult<Chapter<T>>> => {
        if (initialID == null && !initialLoaded) {
          nextID = await this.getLatestChapterID(options)
          // eslint-disable-next-line require-atomic-updates
          initialLoaded = true
        }
        if (nextID == null) {
          return { done: true, value: undefined }
        }
        const chapter = await this.getChapter(nextID, options)
        // eslint-disable-next-line require-atomic-updates
        nextID = chapter.previous
        return { done: false, value: chapter }
      },
    }
  }

  public createLoader(
    newestID: string, // inclusive
    oldestID: string, // exclusive
    options: FetchOptions = {},
  ): Observable<Chapter<T>> {
    return Observable.create(async (observer: Observer<Chapter<T>>) => {
      try {
        // @ts-ignore
        for await (const chapter of this.createIterator(newestID, options)) {
          observer.next(chapter)
          if (chapter.previous === oldestID) {
            observer.complete()
            break
          }
        }
      } catch (err) {
        observer.error(err)
      }
    })
  }

  public async getChapters(
    newestID: string, // inclusive
    oldestID: string, // exclusive
    options: FetchOptions = {},
  ): Promise<Array<Chapter<T>>> {
    const chapters = []
    // @ts-ignore
    for await (const chapter of this.createIterator(newestID, options)) {
      chapters.push(chapter)
      if (chapter.previous === oldestID) {
        break
      }
    }
    return chapters
  }

  public pollLatestChapter(options: PollOptions): Observable<Chapter<T>> {
    const downloadOptions = {
      headers: options.headers,
      mode: 'raw',
    }
    return this.bzz
      .pollFeedContentHash(this.feed, {
        whenEmpty: 'ignore',
        changedOnly: true,
        ...options,
      })
      .pipe(
        flatMap((id: string | null) => {
          return id === null ? [] : this.getChapter(id, downloadOptions)
        }),
      )
  }

  public live(options: LiveOptions): Observable<Array<Chapter<T>>> {
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

        // eslint-disable-next-line require-atomic-updates
        minTimestamp = chapter.timestamp
        // eslint-disable-next-line require-atomic-updates
        previousID = chapter.id

        return chapters
      }),
    )
  }
}

export function createTimeline<T>(config: TimelineConfig<T>): Timeline<T> {
  return new Timeline(config)
}
