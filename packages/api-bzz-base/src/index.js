// @flow

import createHex, {
  hexValueType,
  type hexInput,
  type hexValue,
} from '@erebos/hex'
import { interval, merge, type Observable } from 'rxjs'
import { distinctUntilChanged, filter, flatMap } from 'rxjs/operators'

import { bytesToHexValue, createFeedDigest, getFeedTopic } from './feed'
import type {
  BzzConfig,
  BzzMode,
  DirectoryData,
  DownloadOptions,
  FeedMetadata,
  FeedOptions,
  FeedParams,
  FeedUpdateParams,
  FetchOptions,
  ListResult,
  PollOptions,
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

export const resSwarmHash = (res: *) => {
  return resOrError(res)
    .then(r => r.arrayBuffer())
    .then(value => Buffer.from(new Uint8Array(value)).toString('hex'))
}

const defaultSignBytes = () => {
  return Promise.reject(new Error('Missing `signBytes()` function'))
}

export default class BaseBzz {
  _defaultTimeout: number
  _fetch: *
  _signBytes: SignBytesFunc
  _url: string

  constructor(config: BzzConfig) {
    const { url, timeout } = config
    this._defaultTimeout = timeout ? timeout : 0
    this._signBytes = config.signBytes || defaultSignBytes
    this._url = url
  }

  _fetchTimeout(
    url: string,
    options: FetchOptions,
    params?: Object = {},
  ): Promise<*> {
    const timeout =
      options.timeout == null ? this._defaultTimeout : options.timeout
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

  sign(bytes: Array<number>, params?: any): Promise<hexValue> {
    return this._signBytes(bytes, params).then(bytesToHexValue)
  }

  getDownloadURL(
    hash: string,
    options: DownloadOptions = {},
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

  getUploadURL(options: UploadOptions = {}, raw?: boolean = false): string {
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
    hashOrParams: string | FeedParams | FeedUpdateParams,
    flag?: 'meta',
  ): string {
    let url = this._url + BZZ_MODE_PROTOCOLS.feed
    let query = []

    if (typeof hashOrParams === 'string') {
      // feed hash
      url += hashOrParams
    } else {
      // feed params
      query = Object.keys(hashOrParams).reduce((acc, key) => {
        // $FlowFixMe: hashOrParams type
        const value = hashOrParams[key]
        if (value != null) {
          acc.push(`${key}=${value}`)
        }
        return acc
      }, [])
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
    return this._fetchTimeout(url, options, { body, method: 'POST' })
      .then(resText)
      .then(hexValueType)
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
    if (
      options.headers != null &&
      options.headers['content-type'] == null &&
      !raw
    ) {
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
    params: FeedParams,
    options?: UploadOptions = {},
  ): Promise<hexValue> {
    const manifest = {
      entries: [
        {
          contentType: 'application/bzz-feed',
          mod_time: '0001-01-01T00:00:00Z',
          feed: { topic: getFeedTopic(params), user: params.user },
        },
      ],
    }
    return this.uploadFile(JSON.stringify(manifest), options).then(hexValueType)
  }

  getFeedMetadata(
    hashOrParams: string | FeedParams,
    options?: FetchOptions = {},
  ): Promise<FeedMetadata> {
    const url = this.getFeedURL(hashOrParams, 'meta')
    return this._fetchTimeout(url, options).then(resJSON)
  }

  getFeedValue(
    hashOrParams: string | FeedParams,
    options?: FeedOptions = {},
  ): Promise<*> {
    const url = this.getFeedURL(hashOrParams)
    return this._fetchTimeout(url, options)
      .then(resOrError)
      .then(res => {
        if (options.mode === 'content-hash') {
          return resSwarmHash(res)
        }
        if (options.mode === 'content-response') {
          return resSwarmHash(res).then(hash => this.download(hash))
        }
        return res
      })
  }

  pollFeedValue(
    hashOrParams: string | FeedParams,
    options: PollOptions,
  ): Observable<*> {
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
      pipeline.push(flatMap(() => this.getFeedValue(hashOrParams, options)))
    } else {
      const url = this.getFeedURL(hashOrParams)
      pipeline.push(
        flatMap(() => {
          return this._fetchTimeout(url, options).then(res => {
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

    // In content mode, additional logic can be performed
    if (
      options.mode === 'content-hash' ||
      options.mode === 'content-response'
    ) {
      // Parse response as Swarm content hash
      pipeline.push(
        flatMap(res => {
          return res === null ? Promise.resolve(null) : resSwarmHash(res)
        }),
      )

      // Only continue execution when the content hash has changed
      if (options.contentChangedOnly === true) {
        pipeline.push(distinctUntilChanged())
      }

      // Download contents from the provided hash
      if (options.mode === 'content-response') {
        pipeline.push(
          flatMap(hash => {
            return hash === null ? Promise.resolve(null) : this.download(hash)
          }),
        )
      }
    }

    return merge(interval(options.interval), ...sources).pipe(...pipeline)
  }

  postSignedFeedValue(
    params: FeedUpdateParams,
    body: Buffer,
    options?: FetchOptions = {},
  ): Promise<*> {
    const url = this.getFeedURL(params)
    return this._fetchTimeout(url, options, { method: 'POST', body }).then(
      resOrError,
    )
  }

  postFeedValue(
    meta: FeedMetadata,
    data: hexInput,
    options?: FetchOptions,
    signParams?: any,
  ): Promise<*> {
    const body = createHex(data).toBuffer()
    const digest = createFeedDigest(meta, body)
    return this.sign(digest, signParams).then(signature => {
      const params = {
        user: meta.feed.user,
        topic: meta.feed.topic,
        time: meta.epoch.time,
        level: meta.epoch.level,
        signature,
      }
      return this.postSignedFeedValue(params, body, options)
    })
  }

  updateFeedValue(
    hashOrParams: string | FeedParams,
    data: hexInput,
    options?: FetchOptions,
    signParams?: any,
  ): Promise<*> {
    return this.getFeedMetadata(hashOrParams, options).then(meta => {
      return this.postFeedValue(meta, data, options, signParams)
    })
  }

  uploadFeedValue(
    hashOrParams: string | FeedParams,
    data: string | Buffer | DirectoryData,
    options?: UploadOptions = {},
    signParams?: any,
  ): Promise<hexValue> {
    const { contentType: _c, ...feedOptions } = options
    return Promise.all([
      this.upload(data, options),
      this.getFeedMetadata(hashOrParams, feedOptions),
    ]).then(([hash, meta]) => {
      return this.postFeedValue(
        meta,
        `0x${hash}`,
        feedOptions,
        signParams,
      ).then(() => hash)
    })
  }
}
