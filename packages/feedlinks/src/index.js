// @flow

import type Bzz, { FeedParams, FetchOptions } from '@erebos/api-bzz-base'

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
  id: string,
  timestamp: number,
  references: Array<string>,
  previous?: string,
  type: string,
  author: string,
  content: T,
}

const LINK_DEFAULTS = {
  protocol: PROTOCOL,
  version: VERSION,
  references: [],
  type: 'application/json',
}

// Current timestamp in seconds
const now = () => Math.floor(Date.now() / 1000)

const createLink = <T>(link: $Shape<Feedlink<T>>): Feedlink<T> => ({
  ...LINK_DEFAULTS,
  timestamp: now(),
  ...link,
})

const createLinkFactory = <T>(defaults: $Shape<Feedlink<T>>) => {
  const allDefaults = { ...LINK_DEFAULTS, ...defaults }
  return (link: $Shape<Feedlink<T>>): Feedlink<T> => ({
    ...allDefaults,
    timestamp: now(),
    ...link,
  })
}

const ensureLink = <T: Object>(link: T): T => {
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

  async load<T>(
    hash: string,
    options?: FetchOptions = {},
  ): Promise<Feedlink<T>> {
    return this._bzz
      .getFeedValue(hash, {}, { ...options, mode: 'content-response' })
      .then(res => res.json())
      .then(ensureLink)
  }

  async live() {
    // call pollFeedValue()
    // keep track of last know "previous" hash
    // when new links are pushed, check if "previous" matches
    // if not, create stack and recursively go back in history, then push stack values
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
        const link = await this.load(nextHash)
        nextHash = link.previous
        return { done: nextHash == null, value: link }
      },
    }
  }
}
