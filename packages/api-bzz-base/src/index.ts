import * as stream from 'stream'
import {
  createHex,
  hexInput,
  hexValue,
  toHexValue,
  fromHexValue,
} from '@erebos/hex'
import { interval, merge, Observable, Observer } from 'rxjs'
import { distinctUntilChanged, filter, flatMap } from 'rxjs/operators'
import tarStream from 'tar-stream'

import {
  createFeedDigest,
  getFeedTopic,
  feedParamsToReference,
  feedChunkToData,
  feedParamsToMetadata,
} from './feed'
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
  PinOptions,
  PinnedFile,
  PollOptions,
  PollFeedOptions,
  PollFeedContentHashOptions,
  PollFeedContentOptions,
  SignBytesFunc,
  Tag,
  UploadOptions,
  FileEntry,
} from './types'

export * from './feed'
export * from './types'

export const BZZ_MODE_PROTOCOLS = {
  default: 'bzz:/',
  feed: 'bzz-feed:/',
  feedRaw: 'bzz-feed-raw:/',
  immutable: 'bzz-immutable:/',
  pin: 'bzz-pin:/',
  raw: 'bzz-raw:/',
  tag: 'bzz-tag:/',
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

export async function resOrError<R extends BaseResponse>(res: R): Promise<R> {
  if (res.ok) {
    return res
  }

  const messageMatches = /Message: (.*)$/m.exec(await res.text())
  if (messageMatches && messageMatches.length === 2) {
    throw new HTTPError(res.status, messageMatches[1])
  } else {
    throw new HTTPError(res.status, res.statusText)
  }
}

export async function resJSON<R extends BaseResponse, T = any>(
  res: R,
): Promise<T> {
  return (await resOrError(res)).json<T>()
}

export async function resStream<
  R extends BaseResponse<stream.Readable>,
  T = any
>(res: R): Promise<stream.Readable | ReadableStream> {
  return (await resOrError(res)).body
}

export async function resText<R extends BaseResponse>(res: R): Promise<string> {
  return (await resOrError(res)).text()
}

export async function resHex<R extends BaseResponse>(
  res: R,
): Promise<hexValue> {
  return (await resText(res)) as hexValue
}

export async function resSwarmHash<R extends BaseResponse>(
  res: R,
): Promise<string> {
  const resolvedRes = await resOrError(res)
  const value = await resolvedRes.arrayBuffer()
  return Buffer.from(new Uint8Array(value)).toString('hex')
}

function defaultSignBytes(): Promise<Array<number>> {
  return Promise.reject(new Error('Missing `signBytes()` function'))
}

export function isDirectoryData(
  data: string | Buffer | stream.Readable | ReadableStream | DirectoryData,
): data is DirectoryData {
  if (typeof data !== 'object' || data === null || Array.isArray(data))
    return false

  if (data.constructor !== Object) return false

  const values = Object.values(data)
  if (values.length === 0)
    // Empty object ==> empty directory
    return true

  const el = values[0]
  return typeof el === 'object' && 'data' in el
}

interface PinResponse {
  Address: string
  FileSize: number
  IsRaw: boolean
  PinCounter: number
}

function formatPinnedFile(p: PinResponse): PinnedFile {
  return {
    address: p.Address,
    counter: p.PinCounter,
    raw: p.IsRaw,
    size: p.FileSize,
  }
}

interface TagResponse {
  Uid: number
  Name: string
  Address: string
  Total: number
  Split: number
  Seen: number
  Stored: number
  Sent: number
  Synced: number
  StartedAt: string
}

function formatTag(t: TagResponse): Tag {
  return {
    uid: t.Uid,
    name: t.Name,
    address: t.Address,
    total: t.Total,
    split: t.Split,
    seen: t.Seen,
    stored: t.Stored,
    sent: t.Sent,
    synced: t.Synced,
    startedAt: new Date(t.StartedAt),
  }
}

export class BaseBzz<
  Response extends BaseResponse,
  Readable extends stream.Readable
> {
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

  public getPinURL(hash?: string, raw = false): string {
    let url = this.url + BZZ_MODE_PROTOCOLS.pin
    if (hash != null) {
      url += hash
    }
    if (raw) {
      url += '/?raw=true'
    }
    return url
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

  public async downloadStream(
    hash: string,
    options: DownloadOptions = {},
  ): Promise<Readable> {
    const url = this.getDownloadURL(hash, options)
    const res = await this.fetchTimeout(url, options)
    return this.normalizeStream(await resStream(res))
  }

  protected async downloadTar(
    hash: string,
    options: DownloadOptions,
  ): Promise<Response> {
    if (options.headers == null) {
      options.headers = {}
    }
    options.headers.accept = 'application/x-tar'
    return await this.download(hash, options)
  }

  public downloadObservable(
    hash: string,
    options: DownloadOptions = {},
  ): Observable<FileEntry> {
    return new Observable((observer: Observer<FileEntry>) => {
      this.downloadTar(hash, options).then(
        res => {
          const extract = tarStream.extract()
          extract.on('entry', (header, stream, next) => {
            if (header.type === 'file') {
              const chunks: Array<Buffer> = []
              stream.on('data', (chunk: Buffer) => {
                chunks.push(chunk)
              })
              stream.on('end', () => {
                observer.next({
                  data: Buffer.concat(chunks),
                  path: header.name,
                  size: header.size,
                })
                next()
              })
              stream.resume()
            } else {
              next()
            }
          })
          extract.on('finish', () => {
            observer.complete()
          })

          this.normalizeStream(res.body).pipe(extract)
        },
        err => {
          observer.error(err)
        },
      )
    })
  }

  protected normalizeStream(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    stream: Readable | ReadableStream | NodeJS.ReadableStream,
  ): Readable {
    throw new Error('Must be implemented in extending class')
  }

  public downloadDirectoryData(
    hash: string,
    options: DownloadOptions = {},
  ): Promise<DirectoryData> {
    return new Promise((resolve, reject) => {
      const directoryData: DirectoryData = {}
      this.downloadObservable(hash, options).subscribe({
        next: entry => {
          directoryData[entry.path] = { data: entry.data, size: entry.size }
        },
        error: err => {
          reject(err)
        },
        complete: () => {
          resolve(directoryData)
        },
      })
    })
  }

  protected async uploadBody(
    body: Buffer | FormData | Readable,
    options: UploadOptions,
    raw = false,
  ): Promise<hexValue> {
    const url = this.getUploadURL(options, raw)
    const res = await this.fetchTimeout(url, options, { body, method: 'POST' })
    return await resHex(res)
  }

  public async uploadFile(
    data: string | Buffer | Readable,
    options: UploadOptions = {},
  ): Promise<hexValue> {
    const body = typeof data === 'string' ? Buffer.from(data) : data
    const raw = options.contentType == null

    if (options.headers == null) {
      options.headers = {}
    }

    if (options.size != null) {
      options.headers['content-length'] = options.size
    } else if (Buffer.isBuffer(body)) {
      options.headers['content-length'] = body.length
    }

    if (options.headers['content-type'] == null && !raw) {
      options.headers['content-type'] = options.contentType
    }

    if (options.pin) {
      options.headers['x-swarm-pin'] = true
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
    data: string | Buffer | Readable | DirectoryData,
    options: UploadOptions = {},
  ): Promise<hexValue> {
    return isDirectoryData(data)
      ? await this.uploadDirectory(data, options)
      : await this.uploadFile(data, options)
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
    options: PollFeedOptions,
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

  public async pinEnabled(options: FetchOptions = {}): Promise<boolean> {
    const res = await this.fetchTimeout(this.getPinURL(), options)
    return res.ok
  }

  public async pin(hash: string, options: PinOptions = {}): Promise<void> {
    if (options.download) {
      await this.download(hash, { mode: options.raw ? 'raw' : 'default' })
    }
    const url = this.getPinURL(hash, options.raw)
    await this.fetchTimeout(url, options, { method: 'POST' })
  }

  public async unpin(hash: string, options: FetchOptions = {}): Promise<void> {
    await this.fetchTimeout(this.getPinURL(hash), options, {
      method: 'DELETE',
    })
  }

  public async pins(options: FetchOptions = {}): Promise<Array<PinnedFile>> {
    const res = await this.fetchTimeout(this.getPinURL(), options)
    const pins: Array<PinResponse> = await resJSON(res)
    return pins.map(formatPinnedFile)
  }

  public async getTag(hash: string, options: FetchOptions = {}): Promise<Tag> {
    const res = await this.fetchTimeout(
      this.url + BZZ_MODE_PROTOCOLS.tag + hash,
      options,
    )
    const tag: TagResponse = await resJSON(res)
    return formatTag(tag)
  }

  public pollTag(hash: string, options: PollOptions): Observable<Tag> {
    const sources = []
    // Trigger the flow immediately by default
    if (options.immediate !== false) {
      sources.push([0])
    }
    return merge(interval(options.interval), ...sources).pipe(
      flatMap(async () => await this.getTag(hash, options)),
    )
  }

  private async getRawFeedChunk(
    params: FeedParams,
    options: FetchOptions = {},
  ): Promise<Response> {
    const reference = feedParamsToReference(params)
    const hash = fromHexValue(reference).toString('hex')
    const url = this.url + `${BZZ_MODE_PROTOCOLS.feedRaw}${hash}`
    const response = await this.fetchTimeout(url, options)
    return response
  }

  private async getRawFeedChunkData(
    params: FeedParams,
    options: FetchOptions = {},
  ): Promise<ArrayBuffer> {
    const response = await this.getRawFeedChunk(params, options)
    const dataBuffer = await response.arrayBuffer()
    const data = feedChunkToData(dataBuffer)
    return data
  }

  public async getRawFeedContentHash(
    params: FeedParams,
    options: FetchOptions = {},
  ): Promise<string> {
    const data = await this.getRawFeedChunkData(params, options)
    const hash = Buffer.from(new Uint8Array(data)).toString('hex')
    return hash
  }

  public async getRawFeedContent(
    params: FeedParams,
    options: DownloadOptions = {},
  ): Promise<Response> {
    const contentHash = await this.getRawFeedContentHash(params, options)
    return this.download(contentHash, options)
  }

  public async setRawFeedContentHash(
    params: FeedParams,
    contentHash: string,
    options: UploadOptions = {},
    signParams?: any,
  ): Promise<Response> {
    const meta = feedParamsToMetadata(params)
    return await this.postFeedChunk(
      meta,
      `0x${contentHash}`,
      options,
      signParams,
    )
  }

  public async setRawFeedContent(
    params: FeedParams,
    data: string | Buffer | DirectoryData,
    options: UploadOptions = {},
    signParams?: any,
  ): Promise<hexValue> {
    const { contentType: _c, ...feedOptions } = options
    const hash = await this.upload(data, options)
    const meta = feedParamsToMetadata(params)
    await this.postFeedChunk(meta, `0x${hash}`, feedOptions, signParams)
    return hash
  }
}
