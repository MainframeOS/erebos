import { hexInput, hexValue } from '@erebos/hex'
import { Observable } from 'rxjs'

export interface DirectoryData {
  [path: string]: { data: string | Buffer; contentType: string; size?: number }
}

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

export interface FeedMetadata {
  feed: {
    topic: hexValue
    user: hexValue
  }
  epoch: {
    time: number
    level: number
  }
  protocolVersion: number
}

export interface FetchOptions {
  headers?: Object
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
}

export type FeedMode = 'feed-response' | 'content-hash' | 'content-response'

export interface FeedOptions extends FetchOptions {
  mode?: FeedMode
}

export interface PollOptions extends FeedOptions {
  interval: number
  immediate?: boolean
  whenEmpty?: 'accept' | 'ignore' | 'error'
  contentChangedOnly?: boolean
  trigger?: Observable<void>
}

export interface FeedParams {
  level?: number
  name?: string
  signature?: string
  time?: number
  topic?: string
}

export type SignFeedDigestFunc = (
  digest: Array<number>,
  params?: any,
) => Promise<Array<number>>

export type BzzConfig = {
  signFeedDigest?: SignFeedDigestFunc
  timeout?: number
  url: string
}

export function createFeedDigest(meta: FeedMetadata, data: hexInput): Buffer

export function getFeedTopic(params: FeedParams): hexValue

export class HTTPError extends Error {
  status: number
  constructor(status: number, message: string)
}

export default abstract class BaseBzz<T> {
  constructor(config: BzzConfig)
  signFeedDigest(digest: Array<number>, params?: any): Promise<hexValue>
  getDownloadURL(hash: string, options: DownloadOptions, raw?: boolean): string
  getUploadURL(options: UploadOptions, raw?: boolean): string
  getFeedURL(userOrHash: string, options?: FeedOptions, flag?: 'meta'): string
  hash(domain: string, headers?: Object): Promise<hexValue>
  list(
    hash: string,
    options?: DownloadOptions,
    headers?: Object,
  ): Promise<ListResult>
  download(
    hash: string,
    options?: DownloadOptions,
    headers?: Object,
  ): Promise<T>
  uploadFile(
    data: string | Buffer,
    options?: UploadOptions,
    headers?: Object,
  ): Promise<hexValue>
  upload(
    data: string | Buffer | DirectoryData,
    options?: UploadOptions,
    headers?: Object,
  ): Promise<hexValue>
  deleteResource(
    hash: string,
    path: string,
    headers?: Object,
  ): Promise<hexValue>
  createFeedManifest(
    user: string,
    options?: FeedOptions,
    headers?: Object,
  ): Promise<hexValue>
  getFeedMetadata(
    userOrHash: string,
    params?: FeedParams,
    options?: FetchOptions,
  ): Promise<FeedMetadata>
  getFeedValue(
    userOrHash: string,
    params?: FeedParams,
    options?: FeedOptions,
  ): Promise<T | string>
  pollFeedValue(
    userOrHash: string,
    options: PollOptions,
    params?: FeedParams,
  ): Observable<T | string>
  postSignedFeedValue(
    user: string,
    params: FeedParams,
    body: Buffer,
    options?: FetchOptions,
  ): Promise<T>
  postFeedValue(
    meta: FeedMetadata,
    data: hexInput,
    options?: FetchOptions,
    signParams?: any,
  ): Promise<T>
  updateFeedValue(
    userOrHash: string,
    data: hexInput,
    feedParams?: FeedParams,
    options?: FetchOptions,
    signParams?: any,
  ): Promise<T>
  uploadFeedValue(
    userOrHash: string,
    data: string | Buffer | DirectoryData,
    feedParams?: FeedParams,
    options?: UploadOptions,
    signParams?: any,
  ): Promise<hexValue>
}
