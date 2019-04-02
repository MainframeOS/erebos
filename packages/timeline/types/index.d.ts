import Bzz, {
  FeedParams,
  FetchOptions,
  UploadOptions,
} from '@erebos/api-bzz-base'
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

export interface TimelineConfig<C = any, B = any, S = any> {
  bzz: Bzz<B>
  feed: string | FeedParams
  decode?: DecodeChapter<C>
  encode?: EncodeChapter<C>
  signParams?: S
}

export class Timeline<T = any> {
  constructor(config: TimelineConfig<T>)
  download(id: string, options?: FetchOptions): Promise<Chapter<T>>
  upload(chapter: PartialChapter<T>, options?: UploadOptions): Promise<hexValue>
  getChapterID(options?: FetchOptions): Promise<hexValue | null>
  loadChapter(options?: FetchOptions): Promise<Chapter<T> | null>
  updateChapterID(chapterID: string, options?: FetchOptions): Promise<void>
  addChapter(
    chapter: PartialChapter<T>,
    options?: UploadOptions,
  ): Promise<hexValue>
  createUpdater(
    chapterDefaults?: Partial<PartialChapter<T>>,
    options?: UploadOptions,
  ): (partialChapter: Partial<PartialChapter<T>>) => Promise<Chapter<T>>
  createIterator(
    initialID?: string,
    options?: FetchOptions,
  ): AsyncIterableIterator<Chapter<T>>
  loadChapters(
    newestID: string, // inclusive
    oldestID: string, // exclusive
    options?: FetchOptions,
  ): Promise<Array<Chapter<T>>>
  live(options: LiveOptions): Observable<Array<Chapter<T>>>
}

export function createTimeline<T = any>(config: TimelineConfig<T>): Timeline<T>
