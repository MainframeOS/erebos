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

export interface PollOptions extends FetchOptions {
  interval: number
}

export interface LiveOptions extends PollOptions {
  previous?: string
  timestamp?: number
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
  downloadChapter(id: string, options?: FetchOptions): Promise<Chapter<T>>
  uploadChapter(
    chapter: PartialChapter<T>,
    options?: UploadOptions,
  ): Promise<hexValue>
  getLatestChapterID(options?: FetchOptions): Promise<hexValue | null>
  getLatestChapter(options?: FetchOptions): Promise<Chapter<T> | null>
  setLatestChapterID(chapterID: string, options?: FetchOptions): Promise<void>
  setLatestChapter(
    chapter: PartialChapter<T>,
    options?: UploadOptions,
  ): Promise<hexValue>
  addChapter(
    chapter: PartialChapter<T>,
    options?: UploadOptions,
  ): Promise<Chapter<T>>
  createAddChapter(
    chapterDefaults?: Partial<PartialChapter<T>>,
    options?: UploadOptions,
  ): (partialChapter: Partial<PartialChapter<T>>) => Promise<Chapter<T>>
  createIterator(
    initialID?: string,
    options?: FetchOptions,
  ): AsyncIterableIterator<Chapter<T>>
  createLoader(
    newestID: string, // inclusive
    oldestID: string, // exclusive
    options?: FetchOptions,
  ): Observable<Chapter<T>>
  loadChapters(
    newestID: string, // inclusive
    oldestID: string, // exclusive
    options?: FetchOptions,
  ): Promise<Array<Chapter<T>>>
  pollLatestChapter(options: PollOptions): Observable<Chapter<T>>
  live(options: LiveOptions): Observable<Array<Chapter<T>>>
}

export function createTimeline<T = any>(config: TimelineConfig<T>): Timeline<T>
