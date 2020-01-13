import { getFeedTopic } from '@erebos/bzz-feed'
import { DataListWriter } from '@erebos/feed-list'
import Automerge, { Change, ChangeFn, Doc } from 'automerge'

import { DocReader } from './DocReader'
import { downloadMeta, uploadMeta } from './loaders'
import {
  Bzz,
  CreateDocWriterParams,
  DataContent,
  DocFeeds,
  DocSerialized,
  DocWriterParams,
  FeedFactoryParams,
  FromJSONDocParams,
  InitDocWriterParams,
  LoadDocParams,
} from './types'

export const DATA_FEED_NAME = 'doc-sync/data'
export const META_FEED_NAME = 'doc-sync/meta'

export function getDocFeeds(feed: FeedFactoryParams): DocFeeds {
  return {
    data: {
      user: feed.user,
      topic: getFeedTopic({ topic: feed.topic, name: DATA_FEED_NAME }),
    },
    meta: {
      user: feed.user,
      topic: getFeedTopic({ topic: feed.topic, name: META_FEED_NAME }),
    },
  }
}

export class DocWriter<T, B extends Bzz = Bzz> extends DocReader<T, B> {
  static create<T, B extends Bzz = Bzz>(
    params: CreateDocWriterParams<B>,
  ): DocWriter<T, B> {
    const feeds = getDocFeeds(params.feed)
    return new DocWriter<T, B>({
      bzz: params.bzz,
      doc: Automerge.init(),
      feed: feeds.meta,
      list: new DataListWriter<DataContent, B>({
        bzz: params.bzz,
        feed: feeds.data,
      }),
    })
  }

  static async init<T, B extends Bzz = Bzz>(
    params: InitDocWriterParams<T, B>,
  ): Promise<DocWriter<T, B>> {
    const feeds = getDocFeeds(params.feed)
    const writer = new DocWriter<T, B>({
      bzz: params.bzz,
      doc: Automerge.from<T>(params.doc),
      feed: feeds.meta,
      list: new DataListWriter<DataContent, B>({
        bzz: params.bzz,
        feed: feeds.data,
      }),
    })
    await writer.push()
    return writer
  }

  static fromJSON<T, B extends Bzz = Bzz>(
    params: FromJSONDocParams<B>,
  ): DocWriter<T, B> {
    return new DocWriter<T, B>({
      bzz: params.bzz,
      doc: Automerge.load<T>(params.docString),
      feed: params.metaFeed,
      list: new DataListWriter<DataContent, B>({
        bzz: params.bzz,
        feed: params.dataFeed,
      }),
    })
  }

  static async load<T, B extends Bzz = Bzz>(
    params: LoadDocParams<B>,
  ): Promise<DocWriter<T, B>> {
    const { bzz, feed } = params
    const doc = Automerge.init<T>()
    const meta = await downloadMeta(bzz, feed)
    const list = new DataListWriter<DataContent, B>({
      bzz,
      feed: meta.dataFeed,
    })
    const writer = new DocWriter<T, B>({ bzz, doc, feed, list })
    await writer.pull()
    return writer
  }

  protected list: DataListWriter<DataContent, B>
  protected pushedDoc: Doc<T> | null = null
  protected pushQueue: Promise<string> | null = null

  public constructor(params: DocWriterParams<T, B>) {
    super({ ...params, time: params.list.length })
    this.list = params.list
  }

  public get length(): number {
    return this.list.length
  }

  public change(updater: ChangeFn<T>): boolean {
    const doc = Automerge.change(this.value, updater)
    return this.write(doc)
  }

  public merge(other: Doc<T>): boolean {
    const doc = Automerge.merge(this.value, other)
    return this.write(doc)
  }

  private async pushChanges(changes: Array<Change>): Promise<string> {
    const doc = this.value
    // TODO: add other content data, such as protocol name and version
    await this.list.push({ changes })
    this.pushedDoc = doc
    // TODO: based on snapshot config, eventually push snapshot
    return await uploadMeta(this.bzz, this.feed, {
      dataFeed: this.list.getID().params,
    })
  }

  public async push(): Promise<string | null> {
    if (this.pushQueue != null) {
      await this.pushQueue
    }

    const value = this.value
    const changes = Automerge.getChanges(
      this.pushedDoc ?? Automerge.init<T>(),
      value,
    )
    if (changes.length === 0) {
      return null
    }

    this.pushQueue = this.pushChanges(changes)
    const hash = await this.pushQueue

    this.pushedDoc = value
    this.pushQueue = null
    return hash
  }

  public toJSON(): DocSerialized {
    return {
      docString: Automerge.save(this.value),
      dataFeed: this.list.getID().params,
      metaFeed: this.feed,
    }
  }
}
