import { createHex, hexInput, hexValue, toHexValue } from '@erebos/hex'
import { interval, merge, Observable } from 'rxjs'
import { distinctUntilChanged, filter, flatMap } from 'rxjs/operators'

import { createFeedDigest, getFeedTopic } from './feed'
import {
  BaseResponse,
  RequestInit,
  Fetch,
  BzzConfig,
  BzzMode,
  DirectoryData,
  DownloadOptions,
  FeedMetadata,
  FeedParams,
  FeedUpdateParams,
  FetchOptions,
  ListResult,
  PollOptions,
  PollContentHashOptions,
  PollContentOptions,
  SignBytesFunc,
  UploadOptions,
} from './types'

export * from './feed'
export * from './types'

export const BZZ_MODE_PROTOCOLS = {
  default: 'bzz:/',
  feed: 'bzz-feed:/',
  immutable: 'bzz-immutable:/',
  raw: 'bzz-raw:/',
}

export function getModeProtocol(mode?: BzzMode): string {
  return (mode && BZZ_MODE_PROTOCOLS[mode]) || BZZ_MODE_PROTOCOLS.default
}

export class HTTPError extends Error {
  public status: number

  public constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

export function resOrError<R extends BaseResponse>(res: R): R {
  if (res.ok) {
    return res
  }
  throw new HTTPError(res.status, res.statusText)
}

export async function resJSON<R extends BaseResponse, T = any>(
  res: R,
): Promise<T> {
  return await resOrError(res).json<T>()
}

export async function resText<R extends BaseResponse>(res: R): Promise<string> {
  return await resOrError(res).text()
}

export async function resHex<R extends BaseResponse>(
  res: R,
): Promise<hexValue> {
  return (await resText(res)) as hexValue
}

export async function resSwarmHash<R extends BaseResponse>(
  res: R,
): Promise<string> {
  const value = await resOrError(res).arrayBuffer()
  return Buffer.from(new Uint8Array(value)).toString('hex')
}

function defaultSignBytes(): Promise<Array<number>> {
  return Promise.reject(new Error('Missing `signBytes()` function'))
}

export class BaseBzz<Response extends BaseResponse> {
  protected defaultTimeout: number
  protected fetch: Fetch<Response>
  protected signBytes: SignBytesFunc
  protected url: string

  public constructor(fetch: Fetch<Response>, config: BzzConfig) {
    const { url, timeout } = config
    this.fetch = fetch
    this.defaultTimeout = timeout ? timeout : 0
    this.signBytes = config.signBytes || defaultSignBytes
    this.url = url
  }

  protected fetchTimeout(
    url: string,
    options: FetchOptions,
    params: RequestInit = {},
  ): Promise<Response> {
    const timeout =
      options.timeout == null ? this.defaultTimeout : options.timeout
    if (options.headers != null) {
      params.headers = options.headers
    }

    if (timeout === 0) {
      // No timeout
      return this.fetch(url, params)
    }

    return new Promise((resolve, reject) => {
      const timeoutID = setTimeout(() => {
        reject(new Error('Timeout'))
      }, timeout)
      this.fetch(url, params).then((res: Response) => {
        clearTimeout(timeoutID)
        resolve(res)
      })
    })
  }

  public async sign(bytes: Array<number>, params?: any): Promise<hexValue> {
    const signed = await this.signBytes(bytes, params)
    return toHexValue(signed)
  }

  public getDownloadURL(
    hash: string,
    options: DownloadOptions = {},
    raw = false,
  ): string {
    const protocol = raw
      ? BZZ_MODE_PROTOCOLS.raw
      : getModeProtocol(options.mode)
    let url = `${this.url}${protocol}${hash}/`
    if (options.path != null) {
      url += options.path
    }
    if (options.mode === 'raw' && options.contentType != null) {
      url += `?content_type=${options.contentType}`
    }
    return url
  }

  public getUploadURL(options: UploadOptions = {}, raw = false): string {
    // Default URL to creation
    let url = this.url + BZZ_MODE_PROTOCOLS[raw ? 'raw' : 'default']
    // Manifest update if hash is provided
    if (options.manifestHash != null) {
      url += `${options.manifestHash}/`
      if (options.path != null) {
        url += options.path
      }
    }
    if (options.defaultPath != null) {
      url += `?defaultpath=${options.defaultPath}`
    }
    return url
  }

  public getFeedURL(
    hashOrParams: string | FeedParams | FeedUpdateParams,
    flag?: 'meta',
  ): string {
    let url = this.url + BZZ_MODE_PROTOCOLS.feed
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

  public async hash(
    domain: string,
    options: FetchOptions = {},
  ): Promise<hexValue> {
    const res = await this.fetchTimeout(
      `${this.url}bzz-hash:/${domain}`,
      options,
    )
    return await resHex(res)
  }

  public async list(
    hash: string,
    options: DownloadOptions = {},
  ): Promise<ListResult> {
    let url = `${this.url}bzz-list:/${hash}/`
    if (options.path != null) {
      url += options.path
    }
    const res = await this.fetchTimeout(url, options)
    return await resJSON(res)
  }

  public async download(
    hash: string,
    options: DownloadOptions = {},
  ): Promise<Response> {
    const url = this.getDownloadURL(hash, options)
    const res = await this.fetchTimeout(url, options)
    return resOrError(res)
  }

  protected async uploadBody(
    body: any,
    options: UploadOptions,
    raw = false,
  ): Promise<hexValue> {
    const url = this.getUploadURL(options, raw)
    const res = await this.fetchTimeout(url, options, { body, method: 'POST' })
    return await resHex(res)
  }

  public async uploadFile(
    data: string | Buffer,
    options: UploadOptions = {},
  ): Promise<hexValue> {
    const body = typeof data === 'string' ? Buffer.from(data) : data
    const raw = options.contentType == null

    if (options.headers == null) {
      options.headers = {}
    }
    options.headers['content-length'] = body.length
    if (
      options.headers != null &&
      options.headers['content-type'] == null &&
      !raw
    ) {
      options.headers['content-type'] = options.contentType
    }

    return await this.uploadBody(body, options, raw)
  }

  public uploadDirectory(
    _directory: DirectoryData,
    _options?: UploadOptions,
  ): Promise<hexValue> {
    return Promise.reject(new Error('Must be implemented in extending class'))
  }

  public async upload(
    data: string | Buffer | DirectoryData,
    options: UploadOptions = {},
  ): Promise<hexValue> {
    return typeof data === 'string' || Buffer.isBuffer(data)
      ? await this.uploadFile(data, options)
      : await this.uploadDirectory(data, options)
  }

  public async deleteResource(
    hash: string,
    path: string,
    options: FetchOptions = {},
  ): Promise<hexValue> {
    const url = this.getUploadURL({ manifestHash: hash, path })
    const res = await this.fetchTimeout(url, options, { method: 'DELETE' })
    return await resHex(res)
  }

  public async createFeedManifest(
    params: FeedParams,
    options: UploadOptions = {},
  ): Promise<hexValue> {
    const manifest = {
      entries: [
        {
          contentType: 'application/bzz-feed',
          mod_time: '0001-01-01T00:00:00Z', // eslint-disable-line @typescript-eslint/camelcase
          feed: { topic: getFeedTopic(params), user: params.user },
        },
      ],
    }
    return await this.uploadFile(JSON.stringify(manifest), options)
  }

  public async getFeedMetadata(
    hashOrParams: string | FeedParams,
    options: FetchOptions = {},
  ): Promise<FeedMetadata> {
    const url = this.getFeedURL(hashOrParams, 'meta')
    const res = await this.fetchTimeout(url, options)
    return await resJSON(res)
  }

  public async getFeedChunk(
    hashOrParams: string | FeedParams,
    options: FetchOptions = {},
  ): Promise<Response> {
    const url = this.getFeedURL(hashOrParams)
    const res = await this.fetchTimeout(url, options)
    return resOrError(res)
  }

  public async getFeedContentHash(
    hashOrParams: string | FeedParams,
    options: FetchOptions = {},
  ): Promise<string> {
    const res = await this.getFeedChunk(hashOrParams, options)
    return await resSwarmHash(res)
  }

  public async getFeedContent(
    hashOrParams: string | FeedParams,
    options: DownloadOptions = {},
  ): Promise<Response> {
    const hash = await this.getFeedContentHash(hashOrParams, {
      headers: options.headers,
      timeout: options.timeout,
    })
    return await this.download(hash, options)
  }

  public pollFeedChunk(
    hashOrParams: string | FeedParams,
    options: PollOptions,
  ): Observable<Response> {
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
          return this.fetchTimeout(url, options).then(res => {
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
    options: PollContentHashOptions,
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
    options: PollContentOptions,
  ): Observable<Response | null> {
    return this.pollFeedContentHash(hashOrParams, options).pipe(
      flatMap(hash => {
        return hash === null
          ? Promise.resolve(null)
          : this.download(hash, options)
      }),
    )
  }

  public async postSignedFeedChunk(
    params: FeedUpdateParams,
    body: Buffer,
    options: FetchOptions = {},
  ): Promise<Response> {
    const url = this.getFeedURL(params)
    const res = await this.fetchTimeout(url, options, { method: 'POST', body })
    return resOrError(res)
  }

  public async postFeedChunk(
    meta: FeedMetadata,
    data: hexInput,
    options?: FetchOptions,
    signParams?: any,
  ): Promise<Response> {
    const body = createHex(data).toBuffer()
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
  ): Promise<Response> {
    const meta = await this.getFeedMetadata(hashOrParams, options)
    return await this.postFeedChunk(meta, data, options, signParams)
  }

  public async setFeedContentHash(
    hashOrParams: string | FeedParams,
    contentHash: string,
    options?: FetchOptions,
    signParams?: any,
  ): Promise<Response> {
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
    data: string | Buffer | DirectoryData,
    options: UploadOptions = {},
    signParams?: any,
  ): Promise<hexValue> {
    const { contentType: _c, ...feedOptions } = options
    const [hash, meta] = await Promise.all([
      this.upload(data, options),
      this.getFeedMetadata(hashOrParams, feedOptions),
    ])
    await this.postFeedChunk(meta, `0x${hash}`, feedOptions, signParams)
    return hash
  }
}
