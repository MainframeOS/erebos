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

export type BzzConfig = {
  signBytes?: SignBytesFunc
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
  sign(bytes: Array<number>, params?: any): Promise<hexValue>
  getDownloadURL(hash: string, options: DownloadOptions, raw?: boolean): string
  getUploadURL(options: UploadOptions, raw?: boolean): string
  getFeedURL(
    hashOrParams: string | FeedParams | FeedUpdateParams,
    flag?: 'meta',
  ): string
  hash(domain: string, options?: FetchOptions): Promise<hexValue>
  list(hash: string, options?: DownloadOptions): Promise<ListResult>
  download(hash: string, options?: DownloadOptions): Promise<T>
  uploadFile(data: string | Buffer, options?: UploadOptions): Promise<hexValue>
  upload(
    data: string | Buffer | DirectoryData,
    options?: UploadOptions,
  ): Promise<hexValue>
  deleteResource(
    hash: string,
    path: string,
    options?: FetchOptions,
  ): Promise<hexValue>
  createFeedManifest(
    params: FeedParams,
    options?: UploadOptions,
  ): Promise<hexValue>
  getFeedMetadata(
    hashOrParams: string | FeedParams,
    options?: FetchOptions,
  ): Promise<FeedMetadata>
  getFeedValue(
    hashOrParams: string | FeedParams,
    options?: FeedOptions,
  ): Promise<T | string>
  pollFeedValue(
    hashOrParams: string | FeedParams,
    options: PollOptions,
  ): Observable<T | string>
  postSignedFeedValue(
    params: FeedUpdateParams,
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
    hashOrParams: string | FeedParams,
    data: hexInput,
    options?: FetchOptions,
    signParams?: any,
  ): Promise<T>
  uploadFeedValue(
    hashOrParams: string | FeedParams,
    data: string | Buffer | DirectoryData,
    options?: UploadOptions,
    signParams?: any,
  ): Promise<hexValue>
}
