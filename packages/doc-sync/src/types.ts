import { Response } from '@erebos/bzz'
import { BzzFeed, Feed, FeedParams } from '@erebos/bzz-feed'
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

export interface ProtocolContent {
  protocol: string
  version: string
}

export interface DataPayload extends DataContent, ProtocolContent {}

export interface MetaPayload extends MetaContent, ProtocolContent {}

export interface DocFeeds {
  data: Feed
  meta: Feed
}

export interface DocSerialized {
  docString: string
  dataFeed: FeedParams
  metaFeed: Feed
}

export interface LoadDocReaderParams<B extends Bzz = Bzz> {
  bzz: B
  feed: Feed // meta feed
}

export interface FromJSONDocReaderParams<B extends Bzz = Bzz>
  extends DocSerialized {
  bzz: B
}

export interface DocReaderParams<T, B extends Bzz = Bzz> {
  bzz: B
  doc: Doc<T>
  feed: Feed
  list: DataListReader<DataPayload, B>
  time: number
}

interface SubscriberParams {
  pullInterval: number
}

export interface DocSubscriberParams<T, B extends Bzz = Bzz>
  extends DocReaderParams<T, B>,
    SubscriberParams {}

export interface FromJSONDocSubscriberParams<B extends Bzz = Bzz>
  extends FromJSONDocReaderParams<B>,
    SubscriberParams {}

export interface LoadDocSubscriberParams<B extends Bzz = Bzz>
  extends LoadDocReaderParams<B>,
    SubscriberParams {}

interface WriterParams {
  signParams?: any
  snapshotFrequency?: number
}

export interface CreateDocWriterParams<B extends Bzz = Bzz>
  extends WriterParams {
  bzz: B
  feed: FeedFactoryParams // params used to create both data and meta feeds
}

export interface InitDocWriterParams<T, B extends Bzz = Bzz>
  extends CreateDocWriterParams<B> {
  doc: T
}

export interface FromJSONDocWriterParams<B extends Bzz = Bzz>
  extends FromJSONDocReaderParams<B>,
    WriterParams {}

export interface LoadDocWriterParams<B extends Bzz = Bzz>
  extends LoadDocReaderParams<B>,
    WriterParams {}

export interface DocWriterParams<T, B extends Bzz = Bzz> extends WriterParams {
  bzz: B
  doc: Doc<T>
  feed: Feed
  list: DataListWriter<DataPayload, B>
}

interface SynchronizerParams extends SubscriberParams {
  pushInterval?: number
}

export interface InitDocSynchronizerParams<T, B extends Bzz = Bzz>
  extends InitDocWriterParams<T, B>,
    SynchronizerParams {
  sources?: Array<Feed>
}

export interface FromJSONDocSynchronizerParams<B extends Bzz = Bzz>
  extends FromJSONDocWriterParams<B>,
    SynchronizerParams {
  sources?: Array<DocSerialized>
}

export interface LoadDocSynchronizerParams<B extends Bzz = Bzz>
  extends LoadDocWriterParams<B>,
    SynchronizerParams {
  sources?: Array<Feed>
}

export interface DocSynchronizerParams<T, B extends Bzz = Bzz>
  extends DocWriterParams<T, B> {
  pushInterval?: number
  sources?: Array<DocSubscriber<T, B>>
}

export interface DocSynchronizerSerialized extends DocSerialized {
  sources: Array<DocSerialized>
}
