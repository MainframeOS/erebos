import { BaseBzz, BaseResponse, FeedParams } from '@erebos/api-bzz-base'
import { DataListReader, DataListWriter } from '@erebos/feed-list'
import { Change, Doc } from 'automerge'

import { DocSubscriber } from './DocSubscriber'

export type BzzInstance = BaseBzz<BaseResponse, any>

export interface FeedFactoryParams {
  user: string
  topic?: string
}

export interface DataContent {
  changes: Array<Change>
}

export interface MetaSnapshot {
  hash: string
  time: number
}

export interface MetaContent {
  dataFeed: FeedParams
  snapshot?: MetaSnapshot | undefined
}

export interface DocFeeds {
  data: FeedParams
  meta: FeedParams
}

export interface DocSerialized {
  docString: string
  dataFeed: FeedParams
  metaFeed: FeedParams
}

export interface LoadDocParams<Bzz extends BzzInstance = BzzInstance> {
  bzz: Bzz
  feed: FeedParams // params for meta feed
}

export interface FromJSONDocParams<Bzz extends BzzInstance = BzzInstance>
  extends DocSerialized {
  bzz: Bzz
}

export interface DocReaderParams<T, Bzz extends BzzInstance = BzzInstance> {
  bzz: Bzz
  doc: Doc<T>
  feed: FeedParams
  list: DataListReader<DataContent, Bzz>
  time: number
}

export interface DocSubscriberParams<T, Bzz extends BzzInstance = BzzInstance>
  extends DocReaderParams<T, Bzz> {
  pullInterval: number
}

export interface FromJSONDocSubscriberParams<
  Bzz extends BzzInstance = BzzInstance
> extends FromJSONDocParams<Bzz> {
  pullInterval: number
}

export interface LoadDocSubscriberParams<Bzz extends BzzInstance = BzzInstance>
  extends LoadDocParams<Bzz> {
  pullInterval: number
}

export interface CreateDocWriterParams<Bzz extends BzzInstance = BzzInstance> {
  bzz: Bzz
  feed: FeedFactoryParams // params used to create both data and meta feeds
}

export interface InitDocWriterParams<T, Bzz extends BzzInstance = BzzInstance>
  extends CreateDocWriterParams<Bzz> {
  doc: T
}

export interface DocWriterParams<T, Bzz extends BzzInstance = BzzInstance> {
  bzz: Bzz
  doc: Doc<T>
  feed: FeedParams
  list: DataListWriter<DataContent, Bzz>
}

export interface InitDocSynchronizerParams<
  T,
  Bzz extends BzzInstance = BzzInstance
> extends InitDocWriterParams<T, Bzz> {
  pullInterval: number
  pushInterval?: number
  sources?: Array<FeedParams>
}

export interface FromJSONDocSynchronizerParams<
  Bzz extends BzzInstance = BzzInstance
> extends FromJSONDocParams<Bzz> {
  pullInterval: number
  pushInterval?: number
  sources?: Array<DocSerialized>
}

export interface LoadDocSynchronizerParams<
  Bzz extends BzzInstance = BzzInstance
> extends LoadDocParams<Bzz> {
  pullInterval: number
  pushInterval?: number
  sources?: Array<FeedParams>
}

export interface DocSynchronizerParams<
  T,
  Bzz extends BzzInstance = BzzInstance
> extends DocWriterParams<T, Bzz> {
  pushInterval?: number
  sources?: Array<DocSubscriber<T, Bzz>>
}

export interface DocSynchronizerSerialized extends DocSerialized {
  sources: Array<DocSerialized>
}
