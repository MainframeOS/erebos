// @flow

import createHex, {
  hexValueType,
  type hexInput,
  type hexValue,
} from '@erebos/hex'
import elliptic from 'elliptic'
import type EllipticKeyPair from 'elliptic/lib/elliptic/ec/key'
import sha3 from 'js-sha3'

const FEED_TOPIC_LENGTH = 32
const FEED_USER_LENGTH = 20
const FEED_TIME_LENGTH = 7
const FEED_LEVEL_LENGTH = 1
const FEED_HEADER_LENGTH = 8

const ec = new elliptic.ec('secp256k1')

export type KeyPair = EllipticKeyPair

export type DirectoryData = {
  [path: string]: { data: string | Buffer, contentType: string, size?: number },
}

export type FileEntry = {
  data: string | Buffer,
  path: string,
  size?: number,
}

export type ListEntry = {
  hash: string,
  path: string,
  contentType: string,
  size: number,
  mod_time: string,
}

export type ListResult = {
  common_prefixes?: Array<string>,
  entries?: Array<ListEntry>,
}

export type FeedMetadata = {
  feed: {
    topic: hexValue,
    user: hexValue,
  },
  epoch: {
    time: number,
    level: number,
  },
  protocolVersion: number,
}

export type BzzMode = 'default' | 'immutable' | 'raw'

export type SharedOptions = {
  contentType?: string,
  path?: string,
}

export type DownloadOptions = SharedOptions & {
  mode?: BzzMode,
}

export type UploadOptions = SharedOptions & {
  defaultPath?: string,
  encrypt?: boolean,
  manifestHash?: hexValue | string,
}

export type FeedOptions = {
  level?: number,
  name?: string,
  time?: number,
  topic?: hexValue | string,
}

export const BZZ_MODE_PROTOCOLS = {
  default: 'bzz:/',
  feed: 'bzz-feed:/',
  immutable: 'bzz-immutable:/',
  raw: 'bzz-raw:/',
}

export const getModeProtocol = (mode?: ?BzzMode): string => {
  return (mode && BZZ_MODE_PROTOCOLS[mode]) || BZZ_MODE_PROTOCOLS.default
}

export const createFeedDigest = (
  meta: FeedMetadata,
  data: string | Buffer,
): Array<number> => {
  const topicBuffer = createHex(meta.feed.topic).toBuffer()
  if (topicBuffer.length !== FEED_TOPIC_LENGTH) {
    throw new Error('Invalid topic length')
  }
  const userBuffer = createHex(meta.feed.user).toBuffer()
  if (userBuffer.length !== FEED_USER_LENGTH) {
    throw new Error('Invalid user length')
  }

  const headerBuffer = Buffer.alloc(FEED_HEADER_LENGTH, 0)
  headerBuffer.writeInt8(meta.protocolVersion, 0)
  const timeBuffer = Buffer.alloc(FEED_TIME_LENGTH, 0)
  timeBuffer.writeUInt32LE(meta.epoch.time, 0)
  const levelBuffer = Buffer.alloc(FEED_LEVEL_LENGTH, 0)
  levelBuffer.writeUInt8(meta.epoch.level, 0)

  const dataBuffer = createHex(data).toBuffer()

  const payload = Buffer.concat([
    headerBuffer,
    topicBuffer,
    userBuffer,
    timeBuffer,
    levelBuffer,
    dataBuffer,
  ])
  return sha3.keccak256.array(payload)
}

export const createKeyPair = (priv?: string): KeyPair => {
  return priv ? ec.keyFromPrivate(priv) : ec.genKeyPair()
}

export const pubKeyToAddress = (pubKey: Object): hexValue => {
  const bytes = sha3.keccak256.array(pubKey.encode().slice(1)).slice(12)
  return hexValueType('0x' + Buffer.from(bytes).toString('hex'))
}

export const signDigest = (
  digest: Array<number>,
  privKey: Object,
): hexValue => {
  const sigRaw = ec.sign(digest, privKey, { canonical: true })
  const signature = sigRaw.r.toArray().concat(sigRaw.s.toArray())
  signature.push(sigRaw.recoveryParam)
  return hexValueType('0x' + Buffer.from(signature).toString('hex'))
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
    userOrHash: hexValue | string,
    options?: FeedOptions = {},
    flag?: 'manifest' | 'meta',
  ): string {
    let url = this._url + BZZ_MODE_PROTOCOLS.feed
    let params = []

    if (userOrHash.slice(0, 2) === '0x') {
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

  hash(domain: hexValue | string, headers?: Object = {}): Promise<string> {
    return this._fetch(`${this._url}bzz-hash:/${domain}`, { headers }).then(
      resText,
    )
  }

  list(
    hash: hexValue | string,
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
    hash: hexValue | string,
    options: DownloadOptions,
    headers?: Object = {},
  ): Promise<*> {
    const url = this.getDownloadURL(hash, options)
    return this._fetch(url, { headers }).then(resOrError)
  }

  download(
    hash: hexValue | string,
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
  ): Promise<string> {
    const url = this.getUploadURL(options, raw)
    return this._fetch(url, { body, headers, method: 'POST' }).then(resText)
  }

  uploadFile(
    data: string | Buffer,
    options?: UploadOptions = {},
    headers?: Object = {},
  ): Promise<string> {
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
  ): Promise<string> {
    return Promise.reject(new Error('Must be implemented in extending class'))
  }

  upload(
    data: string | Buffer | DirectoryData,
    options?: UploadOptions = {},
    headers?: Object = {},
  ): Promise<string> {
    return typeof data === 'string' || Buffer.isBuffer(data)
      ? // $FlowFixMe: Flow doesn't understand type refinement with Buffer check
        this.uploadFile(data, options, headers)
      : this.uploadDirectory(data, options, headers)
  }

  deleteResource(
    hash: hexValue | string,
    path: string,
    headers?: Object = {},
  ): Promise<string> {
    const url = this.getUploadURL({ manifestHash: hash, path })
    return this._fetch(url, { method: 'DELETE', headers }).then(resText)
  }

  createFeedManifest(
    user: hexValue | string,
    options?: FeedOptions = {},
  ): Promise<hexValue> {
    return this._fetch(this.getFeedURL(user, options, 'manifest'), {
      method: 'POST',
    }).then(resJSON)
  }

  getFeedMetadata(
    user: hexValue | string,
    options?: FeedOptions = {},
  ): Promise<FeedMetadata> {
    return this._fetch(this.getFeedURL(user, options, 'meta')).then(resJSON)
  }

  getFeedValue(
    user: hexValue | string,
    options?: FeedOptions = {},
  ): Promise<*> {
    return this._fetch(this.getFeedURL(user, options)).then(resOrError)
  }

  postFeedValue(
    keyPair: KeyPair,
    data: hexInput,
    options?: FeedOptions = {},
  ): Promise<void> {
    const user = pubKeyToAddress(keyPair.getPublic())
    return this.getFeedMetadata(user, options)
      .then(meta => {
        const dataBuffer = createHex(data).toBuffer()
        const digest = createFeedDigest(meta, dataBuffer)
        const signature = signDigest(digest, keyPair.getPrivate())
        const url = this.getFeedURL(user, {
          ...meta.feed,
          ...meta.epoch,
          signature,
        })
        return this._fetch(url, { method: 'POST', body: dataBuffer })
      })
      .then(resOrError)
  }
}
