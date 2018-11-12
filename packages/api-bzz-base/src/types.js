// @flow

import type { hexValue } from '@erebos/hex'
import type EllipticKeyPair from 'elliptic/lib/elliptic/ec/key'

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
