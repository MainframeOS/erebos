import {
  BZZ_MODE_PROTOCOLS,
  Bzz,
  DownloadOptions,
  HTTPError,
  Response,
  UploadOptions,
  resJSON,
  resOrError,
  resSwarmHash,
  toSwarmHash,
} from '@erebos/bzz'
import { Hex, hexInput, hexValue, toHexValue } from '@erebos/hex'
import { interval, merge, Observable } from 'rxjs'
import { distinctUntilChanged, filter, flatMap } from 'rxjs/operators'

import {
  FeedID,
  createFeedDigest,
  getFeedChunkData,
  getFeedMetadata,
  getFeedTopic,
} from './feed'
import {
  BzzFeedConfig,
  FeedMetadata,
  FeedParams,
  FeedUpdateParams,
  FetchOptions,
  PollFeedOptions,
  PollFeedContentHashOptions,
  PollFeedContentOptions,
  SignBytesFunc,
} from './types'

export * from './feed'
export * from './types'

export class BzzFeed<S, R extends Response<S>> {
  protected readonly signBytes: SignBytesFunc

  public readonly bzz: Bzz<S, R>

  public constructor(config: BzzFeedConfig<S, R>) {
    this.bzz = config.bzz
    this.signBytes = config.signBytes
  }

  public async sign(bytes: Array<number>, params?: any): Promise<hexValue> {
    const signed = await this.signBytes(bytes, params)
    return toHexValue(signed)
  }

  public getFeedURL(
    hashOrParams: string | FeedParams | FeedUpdateParams,
    flag?: 'meta',
  ): string {
    let url = this.bzz.url + BZZ_MODE_PROTOCOLS.feed
    const query: Array<string> = []

    if (typeof hashOrParams === 'string') {
      // feed hash
      url += `${hashOrParams}/`
    } else {
      // feed params
      const params: { [index: string]: any } = hashOrParams
      Object.keys(params).forEach(key => {
        const value = params[key]
        if (value != null) {
          query.push(`${key}=${value}`)
        }
      })
    }

    if (flag != null) {
      query.push(`${flag}=1`)
    }

    return query.length > 0 ? `${url}?${query.join('&')}` : url
  }

  public async createFeedManifest(
    params: FeedParams,
    options: UploadOptions = {},
  ): Promise<string> {
    const manifest = {
      entries: [
        {
          contentType: 'application/bzz-feed',
          mod_time: '0001-01-01T00:00:00Z', // eslint-disable-line @typescript-eslint/camelcase
          feed: { topic: getFeedTopic(params), user: params.user },
        },
      ],
    }
    return await this.bzz.uploadFile(JSON.stringify(manifest), options)
  }

  public async getFeedMetadata(
    hashOrParams: string | FeedParams,
    options: FetchOptions = {},
  ): Promise<FeedMetadata> {
    const url = this.getFeedURL(hashOrParams, 'meta')
    const res = await this.bzz.fetchTimeout(url, options)
    return await resJSON<R, FeedMetadata>(res)
  }

  public async getFeedChunk(
    hashOrParams: string | FeedParams,
    options: FetchOptions = {},
  ): Promise<R> {
    const url = this.getFeedURL(hashOrParams)
    const res = await this.bzz.fetchTimeout(url, options)
    return resOrError<R>(res)
  }

  public async getFeedContentHash(
    hashOrParams: string | FeedParams,
    options: FetchOptions = {},
  ): Promise<string> {
    const res = await this.getFeedChunk(hashOrParams, options)
    return await resSwarmHash<R>(res)
  }

  public async getFeedContent(
    hashOrParams: string | FeedParams,
    options: DownloadOptions = {},
  ): Promise<R> {
    const hash = await this.getFeedContentHash(hashOrParams, {
      headers: options.headers,
      timeout: options.timeout,
    })
    return await this.bzz.download(hash, options)
  }

  public pollFeedChunk(
    hashOrParams: string | FeedParams,
    options: PollFeedOptions,
  ): Observable<R> {
    const sources = []

    // Trigger the flow immediately by default
    if (options.immediate !== false) {
      sources.push([0])
    }

    // An external trigger can be provided in the options so the consumer can execute the flow when needed
    if (options.trigger != null) {
      sources.push(options.trigger)
    }

    const pipeline = []

    // Handle whether the subscription should fail if the feed doesn't have a value
    if (options.whenEmpty === 'error') {
      pipeline.push(flatMap(() => this.getFeedChunk(hashOrParams, options)))
    } else {
      const url = this.getFeedURL(hashOrParams)
      pipeline.push(
        flatMap(() => {
          return this.bzz.fetchTimeout(url, options).then(res => {
            if (res.status === 404) {
              return null
            }
            if (res.ok) {
              return res
            }
            return new HTTPError(res.status, res.statusText)
          })
        }),
      )

      // Default behavior will emit null values, only omit them when option is set
      if (options.whenEmpty === 'ignore') {
        pipeline.push(filter(res => res !== null))
      }
    }

    // @ts-ignore
    return merge(interval(options.interval), ...sources).pipe(...pipeline)
  }

  public pollFeedContentHash(
    hashOrParams: string | FeedParams,
    options: PollFeedContentHashOptions,
  ): Observable<string | null> {
    const pipeline = [
      flatMap((res: Response | null) => {
        return res === null ? Promise.resolve(null) : resSwarmHash(res)
      }),
    ]
    if (options.changedOnly) {
      // @ts-ignore
      pipeline.push(distinctUntilChanged())
    }
    // @ts-ignore
    return this.pollFeedChunk(hashOrParams, options).pipe(...pipeline)
  }

  public pollFeedContent(
    hashOrParams: string | FeedParams,
    options: PollFeedContentOptions,
  ): Observable<R | null> {
    return this.pollFeedContentHash(hashOrParams, options).pipe(
      flatMap(hash => {
        return hash === null
          ? Promise.resolve(null)
          : this.bzz.download(hash, options)
      }),
    )
  }

  public async postSignedFeedChunk(
    params: FeedUpdateParams,
    body: Buffer,
    options: FetchOptions = {},
  ): Promise<R> {
    const url = this.getFeedURL(params)
    const res = await this.bzz.fetchTimeout(url, options, {
      method: 'POST',
      body,
    })
    return resOrError<R>(res)
  }

  public async postFeedChunk(
    meta: FeedMetadata,
    data: hexInput,
    options?: FetchOptions,
    signParams?: any,
  ): Promise<R> {
    const body = Hex.from(data).toBuffer()
    const digest = createFeedDigest(meta, body)
    const signature = await this.sign(digest, signParams)
    return await this.postSignedFeedChunk(
      {
        user: meta.feed.user,
        topic: meta.feed.topic,
        time: meta.epoch.time,
        level: meta.epoch.level,
        signature,
      },
      body,
      options,
    )
  }

  public async setFeedChunk(
    hashOrParams: string | FeedParams,
    data: hexInput,
    options?: FetchOptions,
    signParams?: any,
  ): Promise<R> {
    const meta = await this.getFeedMetadata(hashOrParams, options)
    return await this.postFeedChunk(meta, data, options, signParams)
  }

  public async setFeedContentHash(
    hashOrParams: string | FeedParams,
    contentHash: string,
    options?: FetchOptions,
    signParams?: any,
  ): Promise<R> {
    const meta = await this.getFeedMetadata(hashOrParams, options)
    return await this.postFeedChunk(
      meta,
      `0x${contentHash}`,
      options,
      signParams,
    )
  }

  public async setFeedContent(
    hashOrParams: string | FeedParams,
    content: string | Buffer | S,
    options: UploadOptions = {},
    signParams?: any,
  ): Promise<string> {
    const { contentType: _c, ...feedOptions } = options
    const [hash, meta] = await Promise.all([
      this.bzz.uploadFile(content, options),
      this.getFeedMetadata(hashOrParams, feedOptions),
    ])
    await this.postFeedChunk(meta, `0x${hash}`, feedOptions, signParams)
    return hash
  }

  public async getRawFeedChunk(
    feed: FeedID | FeedMetadata | FeedParams,
    options: FetchOptions = {},
  ): Promise<R> {
    const hash = FeedID.from(feed).toHash()
    const url = this.bzz.url + `${BZZ_MODE_PROTOCOLS.feedRaw}${hash}`
    const res = await this.bzz.fetchTimeout(url, options)
    return resOrError<R>(res)
  }

  public async getRawFeedChunkData(
    feed: FeedID | FeedMetadata | FeedParams,
    options: FetchOptions = {},
  ): Promise<ArrayBuffer> {
    const res = await this.getRawFeedChunk(feed, options)
    const bytes = await res.arrayBuffer()
    return getFeedChunkData(bytes)
  }

  public async getRawFeedContentHash(
    feed: FeedID | FeedMetadata | FeedParams,
    options: FetchOptions = {},
  ): Promise<string> {
    const bytes = await this.getRawFeedChunkData(feed, options)
    return toSwarmHash(bytes)
  }

  public async getRawFeedContent(
    feed: FeedID | FeedMetadata | FeedParams,
    options: DownloadOptions = {},
  ): Promise<R> {
    const contentHash = await this.getRawFeedContentHash(feed, options)
    return await this.bzz.download(contentHash, options)
  }

  public async setRawFeedContentHash(
    feed: FeedID | FeedMetadata | FeedParams,
    contentHash: string,
    options: UploadOptions = {},
    signParams?: any,
  ): Promise<R> {
    return await this.postFeedChunk(
      getFeedMetadata(feed),
      `0x${contentHash}`,
      options,
      signParams,
    )
  }

  public async setRawFeedContent(
    feed: FeedID | FeedMetadata | FeedParams,
    content: string | Buffer | S,
    options: UploadOptions = {},
    signParams?: any,
  ): Promise<string> {
    const { contentType: _c, ...feedOptions } = options
    const meta = getFeedMetadata(feed)
    const hash = await this.bzz.uploadFile(content, options)
    await this.postFeedChunk(meta, `0x${hash}`, feedOptions, signParams)
    return hash
  }
}
