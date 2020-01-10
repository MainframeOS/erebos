import { Response } from '@erebos/bzz'
import { BzzFeed, FeedParams } from '@erebos/bzz-feed'
import { DataListReader, DataListWriter } from '@erebos/feed-list'
import { Change, Doc } from 'automerge'

import { DocSubscriber } from './DocSubscriber'

export type Bzz = BzzFeed<any, Response>

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

export interface LoadDocParams<B extends Bzz = Bzz> {
  bzz: B
  feed: FeedParams // params for meta feed
}

export interface FromJSONDocParams<B extends Bzz = Bzz> extends DocSerialized {
  bzz: B
}

export interface DocReaderParams<T, B extends Bzz = Bzz> {
  bzz: B
  doc: Doc<T>
  feed: FeedParams
  list: DataListReader<DataContent, B>
  time: number
}

export interface DocSubscriberParams<T, B extends Bzz = Bzz>
  extends DocReaderParams<T, B> {
  pullInterval: number
}

export interface FromJSONDocSubscriberParams<B extends Bzz = Bzz>
  extends FromJSONDocParams<B> {
  pullInterval: number
}

export interface LoadDocSubscriberParams<B extends Bzz = Bzz>
  extends LoadDocParams<B> {
  pullInterval: number
}

export interface CreateDocWriterParams<B extends Bzz = Bzz> {
  bzz: B
  feed: FeedFactoryParams // params used to create both data and meta feeds
}

export interface InitDocWriterParams<T, B extends Bzz = Bzz>
  extends CreateDocWriterParams<B> {
  doc: T
}

export interface DocWriterParams<T, B extends Bzz = Bzz> {
  bzz: B
  doc: Doc<T>
  feed: FeedParams
  list: DataListWriter<DataContent, B>
}

export interface InitDocSynchronizerParams<T, B extends Bzz = Bzz>
  extends InitDocWriterParams<T, B> {
  pullInterval: number
  pushInterval?: number
  sources?: Array<FeedParams>
}

export interface FromJSONDocSynchronizerParams<B extends Bzz = Bzz>
  extends FromJSONDocParams<B> {
  pullInterval: number
  pushInterval?: number
  sources?: Array<DocSerialized>
}

export interface LoadDocSynchronizerParams<B extends Bzz = Bzz>
  extends LoadDocParams<B> {
  pullInterval: number
  pushInterval?: number
  sources?: Array<FeedParams>
}

export interface DocSynchronizerParams<T, B extends Bzz = Bzz>
  extends DocWriterParams<T, B> {
  pushInterval?: number
  sources?: Array<DocSubscriber<T, B>>
}

export interface DocSynchronizerSerialized extends DocSerialized {
  sources: Array<DocSerialized>
}
