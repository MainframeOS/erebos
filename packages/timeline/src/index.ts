import { Response, FetchOptions, PollOptions, UploadOptions } from '@erebos/bzz'
import { BzzFeed, FeedParams } from '@erebos/bzz-feed'
import { Observable, Observer } from 'rxjs'
import { flatMap } from 'rxjs/operators'
import {
  satisfies as semverSatisfies,
  valid as semverValid,
  // @ts-ignore
} from 'semver/preload'

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

export type DecodeChapter<T, R extends Response> = (
  res: R,
) => Promise<Chapter<T>>
export type EncodeChapter<T> = (
  chapter: PartialChapter<T>,
) => Promise<string | Buffer>

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
    semverValid(chapter.version) === null ||
    !semverSatisfies(chapter.version, VERSION_RANGE)
  ) {
    throw new Error('Unsupported protocol version')
  }
  return chapter
}

export interface TimelineReaderConfig<
  T = any,
  S = any,
  B extends BzzFeed<S, Response<S>> = BzzFeed<S, Response<S>>
> {
  bzz: B
  feed: string | FeedParams
}

export interface TimelineWriterConfig<
  T = any,
  S = any,
  B extends BzzFeed<S, Response<S>> = BzzFeed<S, Response<S>>
> extends TimelineReaderConfig<T, S, B> {
  signParams?: any
}

export class TimelineReader<
  T = any,
  S = any,
  B extends BzzFeed<S, Response<S>> = BzzFeed<S, Response<S>>
> {
  protected readonly bzzFeed: B
  protected readonly feed: string | FeedParams

  public constructor(config: TimelineReaderConfig<T, S, B>) {
    this.bzzFeed = config.bzz
    this.feed = config.feed
  }

  protected async read(res: Response<S>): Promise<Chapter<T>> {
    return validateChapter<Chapter<T>>(await res.json())
  }

  public async getChapter(
    id: string,
    options: FetchOptions = {},
  ): Promise<Chapter<T>> {
    const res = await this.bzzFeed.bzz.download(id, { ...options, mode: 'raw' })
    const chapter = await this.read(res)
    chapter.id = id
    return chapter
  }

  public async getLatestChapterID(
    options: FetchOptions = {},
  ): Promise<string | null> {
    try {
      return await this.bzzFeed.getContentHash(this.feed, options)
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
    return this.bzzFeed
      .pollContentHash(this.feed, {
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
    let minTimestamp = options.timestamp ?? Date.now()
    let previousID = options.previous ?? null

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

export class TimelineWriter<
  T = any,
  S = any,
  B extends BzzFeed<S, Response<S>> = BzzFeed<S, Response<S>>
> extends TimelineReader<T, S, B> {
  protected signParams: any

  public constructor(config: TimelineWriterConfig<T, S, B>) {
    super(config)
    this.signParams = config.signParams
  }

  protected async write(chapter: PartialChapter<T>): Promise<string> {
    return Promise.resolve(JSON.stringify(chapter))
  }

  public async postChapter(
    chapter: PartialChapter<T>,
    options: UploadOptions = {},
  ): Promise<string> {
    const encoded = await this.write(chapter)
    return await this.bzzFeed.bzz.uploadFile(encoded, options)
  }

  public async setLatestChapterID(
    chapterID: string,
    options?: FetchOptions,
  ): Promise<void> {
    await this.bzzFeed.setContentHash(
      this.feed,
      chapterID,
      options,
      this.signParams,
    )
  }

  public async setLatestChapter(
    chapter: PartialChapter<T>,
    options: UploadOptions = {},
  ): Promise<string> {
    const [chapterID, feedMeta] = await Promise.all([
      this.postChapter(chapter, options),
      this.bzzFeed.getMetadata(this.feed),
    ])
    await this.bzzFeed.postChunk(
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
}

export function createTimeline<T>(
  config: TimelineWriterConfig<T>,
): TimelineWriter<T> {
  return new TimelineWriter<T>(config)
}
