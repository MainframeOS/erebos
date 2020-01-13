import { resOrError, resJSON, resStream, resText } from './http'
import {
  RequestInit,
  Response,
  Fetch,
  BzzConfig,
  BzzMode,
  DownloadOptions,
  FetchOptions,
  ListResult,
  PinOptions,
  PinResponse,
  PinnedFile,
  Tag,
  TagResponse,
  UploadOptions,
} from './types'
import { getGlobalFetch, formatPinnedFile, formatTag } from './utils'

export * from './http'
export * from './types'
export * from './utils'

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

export class Bzz<S, R extends Response<S>, F = any> {
  protected readonly defaultTimeout: number
  protected readonly fetch: Fetch<R>

  public readonly url: string

  public constructor(config: BzzConfig<R>) {
    const { fetch, timeout, url } = config
    this.fetch = fetch ?? getGlobalFetch<R>()
    this.defaultTimeout = timeout ?? 0
    this.url = url.endsWith('/') ? url : `${url}/`
  }

  public fetchTimeout(
    url: string,
    options: FetchOptions,
    params: RequestInit = {},
  ): Promise<R> {
    const timeout = options.timeout ?? this.defaultTimeout
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
      this.fetch(url, params).then((res: R) => {
        clearTimeout(timeoutID)
        resolve(res)
      })
    })
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
  ): Promise<string> {
    const res = await this.fetchTimeout(
      `${this.url}bzz-hash:/${domain}`,
      options,
    )
    return await resText<R>(res)
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
    return await resJSON<R, ListResult>(res)
  }

  public async download(
    hash: string,
    options: DownloadOptions = {},
  ): Promise<R> {
    const url = this.getDownloadURL(hash, options)
    const res = await this.fetchTimeout(url, options)
    return resOrError<R>(res)
  }

  public async downloadStream(
    hash: string,
    options: DownloadOptions = {},
  ): Promise<S> {
    const url = this.getDownloadURL(hash, options)
    const res = await this.fetchTimeout(url, options)
    return await resStream<S, R>(res)
  }

  public async downloadData<T = any>(
    hash: string,
    options: DownloadOptions = {},
  ): Promise<T> {
    const url = this.getDownloadURL(hash, { ...options, mode: 'raw' })
    const res = await this.fetchTimeout(url, options)
    return await resJSON<Response, T>(res)
  }

  public async downloadTar(hash: string, options: DownloadOptions): Promise<R> {
    if (options.headers == null) {
      options.headers = {}
    }
    options.headers.accept = 'application/x-tar'
    return await this.download(hash, options)
  }

  protected async uploadBody(
    body: Buffer | F | S,
    options: UploadOptions,
    raw = false,
  ): Promise<string> {
    const url = this.getUploadURL(options, raw)
    const res = await this.fetchTimeout(url, options, { body, method: 'POST' })
    return await resText<R>(res)
  }

  public async uploadFile(
    data: string | Buffer | S,
    options: UploadOptions = {},
  ): Promise<string> {
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

  public async uploadData<T = any>(
    data: T,
    options: UploadOptions = {},
  ): Promise<string> {
    return await this.uploadFile(JSON.stringify(data), options)
  }

  public async deleteResource(
    hash: string,
    path: string,
    options: FetchOptions = {},
  ): Promise<string> {
    const url = this.getUploadURL({ manifestHash: hash, path })
    const res = await this.fetchTimeout(url, options, { method: 'DELETE' })
    return await resText<R>(res)
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
    const res = await this.fetchTimeout(url, options, { method: 'POST' })
    resOrError<R>(res)
  }

  public async unpin(hash: string, options: FetchOptions = {}): Promise<void> {
    const res = await this.fetchTimeout(this.getPinURL(hash), options, {
      method: 'DELETE',
    })
    resOrError<R>(res)
  }

  public async pins(options: FetchOptions = {}): Promise<Array<PinnedFile>> {
    const res = await this.fetchTimeout(this.getPinURL(), options)
    const pins = await resJSON<R, Array<PinResponse>>(res)
    return pins.map(formatPinnedFile)
  }

  public async getTag(hash: string, options: FetchOptions = {}): Promise<Tag> {
    const res = await this.fetchTimeout(
      this.url + BZZ_MODE_PROTOCOLS.tag + hash,
      options,
    )
    const tag = await resJSON<R, TagResponse>(res)
    return formatTag(tag)
  }
}
