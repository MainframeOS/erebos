import { hexValue } from '@erebos/hex'
import { Observable } from 'rxjs'

export interface BaseResponse<BodyStream = any> {
  readonly ok: boolean
  readonly status: number
  readonly statusText: string
  readonly body: BodyStream
  text(): Promise<string>
  json<T = any>(): Promise<T>
  arrayBuffer(): Promise<ArrayBuffer>
}

export type RequestInit = Record<string, any>

export type Fetch<Response extends BaseResponse> = (
  resource: string,
  init?: RequestInit,
) => Promise<Response>

export interface DirectoryEntry {
  data: string | Buffer
  contentType?: string
  size?: number
}

export type DirectoryData = Record<string, DirectoryEntry>

export interface FileEntry {
  data: string | Buffer
  path: string
  size?: number
}

export interface ListEntry {
  hash: string
  path: string
  contentType: string
  size: number
  mod_time: string
}

export interface ListResult {
  common_prefixes?: Array<string>
  entries?: Array<ListEntry>
}

export interface FeedTopicParams {
  name?: string
  topic?: string
}

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

export interface FetchOptions {
  headers?: Record<string, any>
  timeout?: number
}

export interface FileOptions extends FetchOptions {
  contentType?: string
  path?: string
}

export type BzzMode = 'default' | 'immutable' | 'raw'

export interface DownloadOptions extends FileOptions {
  mode?: BzzMode
}

export interface UploadOptions extends FileOptions {
  defaultPath?: string
  encrypt?: boolean
  manifestHash?: hexValue | string
  pin?: boolean
  size?: number
}

export interface PollOptions extends FetchOptions {
  interval: number // in milliseconds
  immediate?: boolean // defaults to true
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

export interface BzzConfig {
  signBytes?: SignBytesFunc
  timeout?: number
  url: string
}
