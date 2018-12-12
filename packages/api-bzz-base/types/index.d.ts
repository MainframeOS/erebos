import { hexInput, hexValue } from '@erebos/hex'
import BN = require('bn.js')
import elliptic = require('elliptic')

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

export type BzzMode = 'default' | 'immutable' | 'raw'

export interface SharedOptions {
  contentType?: string
  path?: string
}

export interface DownloadOptions extends SharedOptions {
  mode?: BzzMode
}

export interface UploadOptions extends SharedOptions {
  defaultPath?: string
  encrypt?: boolean
  manifestHash?: hexValue | string
}

export interface FeedOptions {
  level?: number
  name?: string
  signature?: string
  time?: number
  topic?: string
}

export function createFeedDigest(meta: FeedMetadata, data: hexInput): Buffer

export function createKeyPair(priv?: string, enc?: string): elliptic.ec.KeyPair

export function getFeedTopic(options: FeedOptions): hexValue

export function pubKeyToAddress(pubKey: any): hexValue // pubKey type missing in elliptic definition

export function signFeedDigest(
  digest: Buffer,
  privKey: Buffer | BN | string,
): hexValue

export function signFeedUpdate(
  meta: FeedMetadata,
  data: hexInput,
  privKey: Buffer | BN | string,
): hexValue

export class HTTPError extends Error {
  status: number
  constructor(status: number, message: string)
}

export default abstract class BaseBzz<T> {
  constructor(url: string)
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
    user: string,
    options?: FeedOptions,
    headers?: Object,
  ): Promise<FeedMetadata>
  getFeedValue(
    user: string,
    options?: FeedOptions,
    headers?: Object,
  ): Promise<T>
  postFeedValue(
    keyPair: KeyPair,
    data: hexInput,
    options?: FeedOptions,
    headers?: Object,
  ): Promise<T>
}
