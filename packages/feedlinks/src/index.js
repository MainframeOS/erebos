// @flow

import type Bzz, { FetchOptions } from '@erebos/api-bzz-base'
import type { Observable } from 'rxjs'
import { flatMap } from 'rxjs/operators'

const PROTOCOL = 'feedlinks'
const VERSION = 1

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

export type LiveOptions = {
  interval: number,
}

const LINK_DEFAULTS = {
  protocol: PROTOCOL,
  version: VERSION,
  type: 'application/json',
}

// Current timestamp in seconds
const now = () => Math.floor(Date.now() / 1000)

// const createLink = <T>(link: $Shape<Feedlink<T>>): Feedlink<T> => ({
//   ...LINK_DEFAULTS,
//   timestamp: now(),
//   ...link,
// })

const createLinkFactory = (defaults: $Shape<Feedlink<any>>) => {
  const allDefaults = { ...LINK_DEFAULTS, ...defaults }
  return <T>(link: $Shape<Feedlink<T>>): Feedlink<T> => ({
    ...allDefaults,
    timestamp: now(),
    ...link,
  })
}

const validateLink = <T: Object>(link: T): T => {
  if (link.protocol !== PROTOCOL || link.version !== VERSION) {
    throw new Error('Unsupported payload')
  }
  return link
}

export class Feedlinks {
  _bzz: Bzz

  constructor(bzz: Bzz) {
    this._bzz = bzz
  }

  async loadHash(
    feedHash: string,
    options?: FetchOptions = {},
  ): Promise<?string> {
    return this._bzz
      .getFeedValue(feedHash, {}, { ...options, mode: 'content-hash' })
      .catch(err => (err.status === 404 ? null : Promise.reject(err)))
  }

  async loadLink<T>(
    hash: string,
    options?: FetchOptions = {},
  ): Promise<Feedlink<T>> {
    return this._bzz
      .getFeedValue(hash, {}, { ...options, mode: 'content-response' })
      .then(res => res.json())
      .then(validateLink)
  }

  async loadUpdate<T>(
    feedHash: string,
    options?: FetchOptions = {},
  ): Promise<{ hash: string, link: Feedlink<T> }> {
    return this.loadHash(feedHash, options).then(hash => {
      return this._bzz
        .download(hash)
        .then(res => res.json())
        .then(validateLink)
        .then(link => ({ hash, link }))
    })
  }

  live<T>(feedHash: string, options: LiveOptions): Observable<Feedlink<T>> {
    // keep track of last know "previous" hash
    // when new links are pushed, check if "previous" matches
    // if not, create stack and recursively go back in history, then push stack values
    return this._bzz
      .pollFeedValue(feedHash, {
        ...options,
        mode: 'content-response', // TODO query hash and keep track
        whenEmpty: 'ignore',
        contentChangedOnly: true,
      })
      .pipe(flatMap(res => res.json()))
  }

  async history() {
    // return async iterable
  }

  async createIterable<T>(hash: string): AsyncIterable<T> {
    let nextHash = hash
    return {
      [Symbol.asyncIterator]() {
        return this
      },
      next: async () => {
        const link = await this.loadLink(nextHash)
        nextHash = link.previous
        return { done: nextHash == null, value: link }
      },
    }
  }

  createUpdater<T>(
    feedHash: string,
    linkDefaults?: $Shape<Feedlink<T>> = {},
    defaultSignParams?: any,
  ) {
    return this.loadHash(feedHash).then(previous => {
      // `linkDefaults` could be common values for all updates, for example the `author` and `type`
      const create = createLinkFactory(linkDefaults)

      return (partialLink: Feedlink<T>, signParams?: any) => {
        // Upload the new feedlink and retrieve feed metadata
        const link = create<T>({ ...partialLink, previous })
        return Promise.all([
          this._bzz.upload(JSON.stringify(link), {
            contentType: 'application/json',
          }),
          this._bzz.getFeedMetadata(feedHash),
        ]).then(([contentHash, feedMeta]) => {
          // Update feed value to point to latest feedlink
          return this._bzz
            .postFeedValue(
              feedMeta,
              `0x${contentHash}`,
              {},
              signParams || defaultSignParams,
            )
            .then(() => {
              previous = contentHash
              return link
            })
        })
      }
    })
  }
}
