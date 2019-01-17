// @flow

import type Bzz, { FetchOptions, UploadOptions } from '@erebos/api-bzz-base'
import type { Observable } from 'rxjs'
import { flatMap } from 'rxjs/operators'

export const PROTOCOL = 'feedlinks'
export const VERSION = 1

type JSONValue =
  | null
  | boolean
  | number
  | string
  | Array<JSONValue>
  | { [key: string]: JSONValue }

export type Feedlink<T = JSONValue> = {
  protocol: 'feedlinks',
  version: 1,
  id?: ?string,
  timestamp: number,
  references?: ?Array<string>,
  previous?: ?string,
  type: string,
  author?: ?string,
  content: T,
}

export type LinkUpdate<T> = {
  hash: string,
  link: Feedlink<T>,
}

export type DecodeLink<T> = (res: *) => Promise<Feedlink<T>>
export type EncodeLink<T> = (link: Feedlink<T>) => Promise<string | Buffer>

export type LinkUploadOptions<T: *> = UploadOptions & {
  encode?: ?EncodeLink<T>,
}

export type LinkLoadOptions<T: *> = FetchOptions & {
  decode?: ?DecodeLink<T>,
}

export type LinkLiveOptions<T: *> = LinkLoadOptions<T> & {
  interval: number,
}

const LINK_DEFAULTS = {
  protocol: PROTOCOL,
  version: VERSION,
  type: 'application/json',
}

// Current timestamp in seconds
const now = () => Math.floor(Date.now() / 1000)

export const createLink = <T>(link: $Shape<Feedlink<T>>): Feedlink<T> => ({
  ...LINK_DEFAULTS,
  timestamp: now(),
  ...link,
})

const createLinkFactory = (defaults: $Shape<Feedlink<any>>) => {
  const allDefaults = { ...LINK_DEFAULTS, ...defaults }
  return <T>(link: $Shape<Feedlink<T>>): Feedlink<T> => ({
    ...allDefaults,
    timestamp: now(),
    ...link,
  })
}

export const validateLink = <T: Object>(link: T): T => {
  if (link.protocol !== PROTOCOL || link.version !== VERSION) {
    throw new Error('Unsupported payload')
  }
  return link
}

const defaultDecode: DecodeLink<*> = async (res: *) => {
  return validateLink(await res.json())
}
const defaultEncode: EncodeLink<*> = async (link: Object) => {
  return JSON.stringify(link)
}

type FeedlinksConfig = {
  bzz: Bzz,
  decode?: ?DecodeLink<*>,
  encode?: ?EncodeLink<*>,
}

export default class Feedlinks {
  _bzz: Bzz
  _decode: DecodeLink<any>
  _encode: EncodeLink<any>

  constructor(config: FeedlinksConfig) {
    this._bzz = config.bzz
    this._decode = config.decode || defaultDecode
    this._encode = config.encode || defaultEncode
  }

  async _decodeWith<T>(
    res: *,
    options: LinkLoadOptions<T>,
  ): Promise<Feedlink<T>> {
    const decode = options.decode || this._decode
    return await decode(res)
  }

  async _encodeWith<T>(
    link: Feedlink<T>,
    options: LinkUploadOptions<T>,
  ): Promise<string | Buffer> {
    const encode = options.encode || this._encode
    return await encode(link)
  }

  async download<T>(
    hash: string,
    options?: LinkLoadOptions<T> = {},
  ): Promise<Feedlink<T>> {
    const res = await this._bzz.download(hash)
    return await this._decodeWith<T>(res, options)
  }

  async upload<T>(link: Feedlink<T>, options?: LinkUploadOptions<T> = {}) {
    const encoded = await this._encodeWith<T>(link, options)
    return await this._bzz.uploadFile(encoded, {
      contentType: 'application/json',
      ...options,
    })
  }

  async loadHash(
    feedHash: string,
    options?: FetchOptions = {},
  ): Promise<?string> {
    try {
      return await this._bzz.getFeedValue(
        feedHash,
        {},
        { ...options, mode: 'content-hash' },
      )
    } catch (err) {
      if (err.status === 404) {
        return null
      } else {
        throw err
      }
    }
  }

  async loadLink<T>(
    hash: string,
    options?: LinkLoadOptions<T> = {},
  ): Promise<Feedlink<T>> {
    const res = await this._bzz.getFeedValue(
      hash,
      {},
      { ...options, mode: 'content-response' },
    )
    return await this._decodeWith<T>(res, options)
  }

  async loadUpdate<T>(
    feedHash: string,
    options?: LinkLoadOptions<T> = {},
  ): Promise<LinkUpdate<T>> {
    const hash = await this._bzz.getFeedValue(
      feedHash,
      {},
      { ...options, mode: 'content-hash' },
    )
    const link = await this.download<T>(hash, options)
    return { hash, link }
  }

  createIterable<T>(
    initialHash: string,
    options?: LinkLoadOptions<T> = {},
  ): AsyncIterator<Feedlink<T>> {
    let nextHash = initialHash
    // $FlowFixMe: AsyncIterator
    return {
      // $FlowFixMe: Flow doesn't support symbols as Object keys
      [Symbol.asyncIterator]() {
        return this
      },
      next: async () => {
        if (nextHash == null) {
          return { done: true, value: undefined }
        }
        const link = await this.download<T>(nextHash, options)
        nextHash = link.previous
        return { done: false, value: link }
      },
    }
  }

  async createSlice<T>(
    newestHash: string, // inclusive
    oldestHash: string, // exclusive
    options?: LinkLoadOptions<T> = {},
  ): Promise<Array<Feedlink<T>>> {
    const slice = []
    for await (const link of this.createIterable<T>(newestHash, options)) {
      slice.push(link)
      if (link.previous === oldestHash) {
        break
      }
    }
    return slice
  }

  live<T>(
    feedHash: string,
    options: LinkLiveOptions<T>,
  ): Observable<Array<Feedlink<T>>> {
    let previousKnow
    return this._bzz
      .pollFeedValue(feedHash, {
        ...options,
        mode: 'content-hash',
        whenEmpty: 'ignore',
        contentChangedOnly: true,
      })
      .pipe(
        flatMap(async hash => {
          let links
          const link = await this.download<T>(hash, options)

          if (
            previousKnow === null ||
            link.previous == null ||
            link.previous === previousKnow
          ) {
            // Single link to push
            links = [link]
          } else {
            // There has been more than one update during the polling interval
            const slice = await this.createSlice<T>(
              link.previous,
              previousKnow,
              options,
            )
            links = slice.reverse().concat(link)
          }

          previousKnow = hash
          return links
        }),
      )
  }

  async createUpdater<T>(
    feedHash: string,
    linkDefaults?: $Shape<Feedlink<T>> = {},
    defaultSignParams?: any,
    options?: LinkUploadOptions<T> = {},
  ) {
    let previous = await this.loadHash(feedHash)
    // `linkDefaults` could be common values for all updates, for example the `author` and `type`
    const create = createLinkFactory(linkDefaults)

    return async (
      partialLink: $Shape<Feedlink<T>>,
      signParams?: any,
    ): Promise<Feedlink<T>> => {
      // Upload the new feedlink and retrieve feed metadata
      const link = create<T>({ ...partialLink, previous })
      const [contentHash, feedMeta] = await Promise.all([
        this.upload<T>(link, options),
        this._bzz.getFeedMetadata(feedHash),
      ])
      // Update feed value to point to latest feedlink
      await this._bzz.postFeedValue(
        feedMeta,
        `0x${contentHash}`,
        {},
        signParams || defaultSignParams,
      )
      previous = contentHash
      return link
    }
  }
}
