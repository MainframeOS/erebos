import { Bzz, DownloadOptions, PollOptions, Response } from '@erebos/bzz'
import { hexValue } from '@erebos/hex'
import { Observable } from 'rxjs'

export interface Feed {
  topic: hexValue
  user: hexValue
}

export interface FeedEpoch {
  time: number
  level: number
}

export interface FeedMetadata {
  feed: Feed
  epoch: FeedEpoch
  protocolVersion: number
}

export interface FeedTopicParams {
  name?: string
  topic?: string
}

export interface FetchOptions {
  headers?: Record<string, any>
  timeout?: number
}

export interface PollFeedOptions extends PollOptions {
  whenEmpty?: 'accept' | 'ignore' | 'error' // defaults to 'accept'
  trigger?: Observable<void>
}

export interface PollFeedContentHashOptions extends PollFeedOptions {
  changedOnly?: boolean
}

export interface PollFeedContentOptions
  extends DownloadOptions,
    PollFeedContentHashOptions {}

export interface PinOptions extends FetchOptions {
  download?: boolean
  raw?: boolean
}

export interface PinnedFile {
  address: string
  counter: number
  raw: boolean
  size: number
}

export interface Tag {
  uid: number
  name: string
  address: string
  total: number
  split: number
  seen: number
  stored: number
  sent: number
  synced: number
  startedAt: Date
}

export interface FeedParams {
  user: string
  level?: number
  name?: string
  time?: number
  topic?: string
}

export interface FeedUpdateParams {
  user: string
  level: number
  time: number
  topic: string
  signature: string
}

export type SignBytesFunc = (
  digest: Array<number>,
  params?: any,
) => Promise<Array<number>>

export interface BzzFeedConfig<S, R extends Response<S>> {
  bzz: Bzz<S, R>
  signBytes?: SignBytesFunc
}
