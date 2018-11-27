// @flow

import createHex, {
  hexValueType,
  isHexValue,
  type hexInput,
  type hexValue,
} from '@erebos/hex'

import { getFeedTopic, pubKeyToAddress, signFeedUpdate } from './feed'
import type {
  BzzMode,
  DirectoryData,
  DownloadOptions,
  FeedMetadata,
  FeedOptions,
  KeyPair,
  ListResult,
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
  _fetch: *
  _url: string

  constructor(url: string) {
    this._url = new URL(url).toString()
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
    options?: FeedOptions = {},
    flag?: 'meta',
  ): string {
    let url = this._url + BZZ_MODE_PROTOCOLS.feed
    let params = []

    if (isHexValue(userOrHash)) {
      // user
      params = Object.keys(options).reduce(
        (acc, key) => {
          const value = options[key]
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
      params.push(`${flag}=1`)
    }

    return `${url}?${params.join('&')}`
  }

  hash(domain: string, headers?: Object = {}): Promise<hexValue> {
    return this._fetch(`${this._url}bzz-hash:/${domain}`, { headers }).then(
      resText,
    )
  }

  list(
    hash: string,
    options?: DownloadOptions = {},
    headers?: Object = {},
  ): Promise<ListResult> {
    let url = `${this._url}bzz-list:/${hash}`
    if (options.path != null) {
      url += `/${options.path}`
    }
    return this._fetch(url, { headers }).then(resJSON)
  }

  _download(
    hash: string,
    options: DownloadOptions,
    headers?: Object = {},
  ): Promise<*> {
    const url = this.getDownloadURL(hash, options)
    return this._fetch(url, { headers }).then(resOrError)
  }

  download(
    hash: string,
    options?: DownloadOptions = {},
    headers?: Object,
  ): Promise<*> {
    return this._download(hash, options, headers)
  }

  _upload(
    body: mixed,
    options: UploadOptions,
    headers?: Object = {},
    raw?: boolean = false,
  ): Promise<hexValue> {
    const url = this.getUploadURL(options, raw)
    return this._fetch(url, { body, headers, method: 'POST' }).then(resText)
  }

  uploadFile(
    data: string | Buffer,
    options?: UploadOptions = {},
    headers?: Object = {},
  ): Promise<hexValue> {
    const body = typeof data === 'string' ? Buffer.from(data) : data
    const raw = options.contentType == null
    headers['content-length'] = body.length
    if (headers['content-type'] == null && !raw) {
      headers['content-type'] = options.contentType
    }
    return this._upload(body, options, headers, raw)
  }

  uploadDirectory(
    _directory: DirectoryData,
    _options?: UploadOptions,
    _headers?: Object,
  ): Promise<hexValue> {
    return Promise.reject(new Error('Must be implemented in extending class'))
  }

  upload(
    data: string | Buffer | DirectoryData,
    options?: UploadOptions = {},
    headers?: Object = {},
  ): Promise<hexValue> {
    return typeof data === 'string' || Buffer.isBuffer(data)
      ? // $FlowFixMe: Flow doesn't understand type refinement with Buffer check
        this.uploadFile(data, options, headers)
      : this.uploadDirectory(data, options, headers)
  }

  deleteResource(
    hash: string,
    path: string,
    headers?: Object = {},
  ): Promise<hexValue> {
    const url = this.getUploadURL({ manifestHash: hash, path })
    return this._fetch(url, { method: 'DELETE', headers }).then(resText)
  }

  createFeedManifest(
    user: string,
    options?: FeedOptions = {},
    headers?: Object = {},
  ): Promise<hexValue> {
    const manifest = {
      entries: [
        {
          contentType: 'application/bzz-feed',
          mod_time: '0001-01-01T00:00:00Z',
          feed: { topic: getFeedTopic(options), user },
        },
      ],
    }
    return this.uploadFile(JSON.stringify(manifest), {}, headers).then(
      hexValueType,
    )
  }

  getFeedMetadata(
    user: string,
    options?: FeedOptions = {},
    headers?: Object = {},
  ): Promise<FeedMetadata> {
    const url = this.getFeedURL(user, options, 'meta')
    return this._fetch(url, { headers }).then(resJSON)
  }

  getFeedValue(
    user: string,
    options?: FeedOptions = {},
    headers?: Object = {},
  ): Promise<*> {
    const url = this.getFeedURL(user, options)
    return this._fetch(url, { headers }).then(resOrError)
  }

  postFeedValue(
    keyPair: KeyPair,
    data: hexInput,
    options?: FeedOptions = {},
    headers?: Object = {},
  ): Promise<*> {
    const user = pubKeyToAddress(keyPair.getPublic())
    return this.getFeedMetadata(user, options, headers)
      .then(meta => {
        const body = createHex(data).toBuffer()
        const url = this.getFeedURL(user, {
          ...meta.feed,
          ...meta.epoch,
          signature: signFeedUpdate(meta, body, keyPair.getPrivate()),
        })
        return this._fetch(url, { method: 'POST', body, headers })
      })
      .then(resOrError)
  }
}
