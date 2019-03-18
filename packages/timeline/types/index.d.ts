import Bzz, { FetchOptions, UploadOptions } from '@erebos/api-bzz-base'
import { hexValue } from '@erebos/hex'
import { Observable } from 'rxjs'

export const PROTOCOL = 'timeline'
export const VERSION = '1.0.0'
export const VERSION_RANGE = '^1.0.0'

export interface PartialChapter<T = any> {
  protocol: string
  version: string
  timestamp: number
  references?: Array<string>
  previous?: string
  type: string
  author: string
  content: T
  signature?: string
}

export interface Chapter<T = any> extends PartialChapter<T> {
  id: string
}

export type DecodeChapter<T> = (res: any) => Promise<Chapter<T>>
export type EncodeChapter<T> = (
  chapter: PartialChapter<T>,
) => Promise<string | Buffer>

export interface LiveOptions extends FetchOptions {
  interval: number
}

export function createChapter<T>(
  chapter: Partial<PartialChapter<T>>,
): PartialChapter<T>

export function validateChapter<T = Object>(chapter: T): T

export function defaultDecode(res: any): Promise<Chapter<T>>

export function defaultEncode(chapter: any): Promise<string | Buffer>

export interface TimelineConfig {
  bzz: Bzz
  feed: string | FeedParams
  decode?: DecodeChapter<any>
  encode?: EncodeChapter<any>
  signParams?: any
}

export class Timeline {
  constructor(config: TimelineConfig)
  async download<T>(id: string, options?: FetchOptions): Promise<Chapter<T>>
  async upload<T>(
    chapter: PartialChapter<T>,
    options?: UploadOptions,
  ): Promise<hexValue>
  async getChapterID(options: FetchOptions = {}): Promise<hexValue | null>
  async loadChapter<T>(options: FetchOptions = {}): Promise<Chapter<T> | null>
  async updateChapterID(
    chapterID: string,
    options?: FetchOptions,
  ): Promise<void>
  async addChapter<T>(
    chapter: PartialChapter<T>,
    options?: UploadOptions,
  ): Promise<hexValue>
  createUpdater<T>(
    chapterDefaults?: Partial<PartialChapter<T>>,
    options?: UploadOptions,
  ): (partialChapter: Partial<PartialChapter<T>>) => Promise<Chapter<T>>
  createIterator<T>(
    initialID?: string,
    options?: FetchOptions,
  ): AsyncIterator<Chapter<T>>
  async loadChapters<T>(
    newestID: string, // inclusive
    oldestID: string, // exclusive
    options?: FetchOptions,
  ): Promise<Array<Chapter<T>>>
  live<T>(options: LiveOptions): Observable<Array<Chapter<T>>>
}
