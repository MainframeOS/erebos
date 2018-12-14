// @flow

import createHex, {
  hexValueType,
  isHexValue,
  type hexInput,
  type hexValue,
} from '@erebos/hex'
import { interval, pipe } from 'rxjs'
import { flatMap } from 'rxjs/operators'

import { getFeedTopic, pubKeyToAddress, signFeedUpdate } from './feed'
import type {
  BzzConfig,
  BzzMode,
  DirectoryData,
  DownloadOptions,
  FeedMetadata,
  FeedParams,
  FetchOptions,
  KeyPair,
  ListResult,
  PollOptions,
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

export const getModeProtocol = (mode?: ?BzzMode): string => {
  return (mode && BZZ_MODE_PROTOCOLS[mode]) || BZZ_MODE_PROTOCOLS.default
}

export class HTTPError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

export const resOrError = (res: *) => {
  return res.ok
    ? Promise.resolve(res)
    : Promise.reject(new HTTPError(res.status, res.statusText))
}

export const resJSON = (res: *) => resOrError(res).then(r => r.json())

export const resText = (res: *) => resOrError(res).then(r => r.text())

export default class BaseBzz {
  _defaultTimeout: number
  _fetch: *
  _url: string

  constructor(config: BzzConfig) {
    const { url, timeout } = config
    this.__defaultTimeout = timeout ? timeout : 0
    this._url = new URL(url).toString()
  }

  _fetchTimeout(
    url: string,
    options: FetchOptions,
    params?: Object = {},
  ): Promise<*> {
    const timeout = options.timeout ? options.timeout : this._defaultTimeout
    if (options.headers != null) {
      params.headers = options.headers
    }

    if (timeout === 0) {
      // No timeout
      return this._fetch(url, params)
    }

    return new Promise((resolve, reject) => {
      const timeoutID = setTimeout(() => {
        reject(new Error('Timeout'))
      }, timeout)
      this._fetch(url, params).then(res => {
        clearTimeout(timeoutID)
        resolve(res)
      })
    })
  }

  getDownloadURL(
    hash: string,
    options: DownloadOptions,
    raw?: boolean = false,
  ): string {
    const protocol = raw
      ? BZZ_MODE_PROTOCOLS.raw
      : getModeProtocol(options.mode)
    let url = this._url + protocol + hash
    if (options.path != null) {
      url += `/${options.path}`
    }
    if (options.mode === 'raw' && options.contentType != null) {
      url += `?content_type=${options.contentType}`
    }
    return url
  }

  getUploadURL(options: UploadOptions, raw?: boolean = false): string {
    // Default URL to creation
    let url = this._url + BZZ_MODE_PROTOCOLS[raw ? 'raw' : 'default']
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

  getFeedURL(
    userOrHash: string,
    params?: FeedParams = {},
    flag?: 'meta',
  ): string {
    let url = this._url + BZZ_MODE_PROTOCOLS.feed
    let query = []

    if (isHexValue(userOrHash)) {
      // user
      const { user: _user, ...otherParams } = params // Use provided user
      query = Object.keys(otherParams).reduce(
        (acc, key) => {
          const value = otherParams[key]
          if (value != null) {
            acc.push(`${key}=${value}`)
          }
          return acc
        },
        [`user=${userOrHash}`],
      )
    } else {
      // hash
      url += userOrHash
    }

    if (flag != null) {
      query.push(`${flag}=1`)
    }

    return `${url}?${query.join('&')}`
  }

  hash(domain: string, options?: FetchOptions = {}): Promise<hexValue> {
    return this._fetchTimeout(`${this._url}bzz-hash:/${domain}`, options).then(
      resText,
    )
  }

  list(hash: string, options?: DownloadOptions = {}): Promise<ListResult> {
    let url = `${this._url}bzz-list:/${hash}`
    if (options.path != null) {
      url += `/${options.path}`
    }
    return this._fetchTimeout(url, options).then(resJSON)
  }

  _download(hash: string, options: DownloadOptions): Promise<*> {
    const url = this.getDownloadURL(hash, options)
    return this._fetchTimeout(url, options).then(resOrError)
  }

  download(hash: string, options?: DownloadOptions = {}): Promise<*> {
    return this._download(hash, options)
  }

  _upload(
    body: mixed,
    options: UploadOptions,
    raw?: boolean = false,
  ): Promise<hexValue> {
    const url = this.getUploadURL(options, raw)
    return this._fetchTimeout(url, options, { body, method: 'POST' }).then(
      resText,
    )
  }

  uploadFile(
    data: string | Buffer,
    options?: UploadOptions = {},
  ): Promise<hexValue> {
    const body = typeof data === 'string' ? Buffer.from(data) : data
    const raw = options.contentType == null

    if (options.headers == null) {
      options.headers = {}
    }
    options.headers['content-length'] = body.length
    if (options.headers['content-type'] == null && !raw) {
      options.headers['content-type'] = options.contentType
    }

    return this._upload(body, options, raw)
  }

  uploadDirectory(
    _directory: DirectoryData,
    _options?: UploadOptions,
  ): Promise<hexValue> {
    return Promise.reject(new Error('Must be implemented in extending class'))
  }

  upload(
    data: string | Buffer | DirectoryData,
    options?: UploadOptions = {},
  ): Promise<hexValue> {
    return typeof data === 'string' || Buffer.isBuffer(data)
      ? // $FlowFixMe: Flow doesn't understand type refinement with Buffer check
        this.uploadFile(data, options)
      : this.uploadDirectory(data, options)
  }

  deleteResource(
    hash: string,
    path: string,
    options?: FetchOptions = {},
  ): Promise<hexValue> {
    const url = this.getUploadURL({ manifestHash: hash, path })
    return this._fetchTimeout(url, options, { method: 'DELETE' }).then(resText)
  }

  createFeedManifest(
    user: string,
    params?: FeedParams = {},
    options?: FetchOptions = {},
  ): Promise<hexValue> {
    const manifest = {
      entries: [
        {
          contentType: 'application/bzz-feed',
          mod_time: '0001-01-01T00:00:00Z',
          feed: { topic: getFeedTopic(params), user },
        },
      ],
    }
    return this.uploadFile(JSON.stringify(manifest), options).then(hexValueType)
  }

  getFeedMetadata(
    user: string,
    params?: FeedParams = {},
    options?: FetchOptions = {},
  ): Promise<FeedMetadata> {
    const url = this.getFeedURL(user, params, 'meta')
    return this._fetchTimeout(url, options).then(resJSON)
  }

  getFeedValue(
    user: string,
    params?: FeedParams = {},
    options?: FetchOptions = {},
  ): Promise<*> {
    const url = this.getFeedURL(user, params)
    return this._fetchTimeout(url, options).then(resOrError)
  }

  pollFeedValue(
    user: string,
    params?: FeedParams = {},
    options: PollOptions = {},
  ): Observable<*> {
    if (options.errorWhenNotFound) {
      return pipe(
        interval(options.interval),
        flatMap(() => this.getFeedValue(user, params, options)),
      )
    }

    const url = this.getFeedURL(user, params)
    return pipe(
      interval(options.interval),
      flatMap(async () => {
        const res = await this._fetchTimeout(url, options)
        if (res.status === 404) {
          return null
        }
        if (res.ok) {
          return res
        }
        return new HTTPError(res.status, res.statusText)
      }),
    )
  }

  postSignedFeedValue(
    user: string,
    body: Buffer,
    metadata: FeedMetadata,
    options?: FetchOptions = {},
  ): Promise<*> {
    const url = this.getFeedURL(user, metadata)
    return this._fetchTimeout(url, options, { method: 'POST', body }).then(
      resOrError,
    )
  }

  postFeedValue(
    keyPair: KeyPair,
    data: hexInput,
    params?: FeedParams = {},
    options?: FetchOptions = {},
    maybeMetadata?: FeedMetadata,
  ): Promise<*> {
    const user = pubKeyToAddress(keyPair.getPublic())
    const update = meta => {
      const body = createHex(data).toBuffer()
      return this.postSignedFeedValue(user, body, {
        ...meta.feed,
        ...meta.epoch,
        signature: signFeedUpdate(meta, body, keyPair.getPrivate()),
      })
    }
    return maybeMetadata
      ? update(maybeMetadata)
      : this.getFeedMetadata(user, params, options).then(update)
  }
}
