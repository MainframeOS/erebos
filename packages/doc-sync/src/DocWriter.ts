import { getFeedTopic } from '@erebos/api-bzz-base'
import { DataListWriter } from '@erebos/feed-list'
import Automerge, { Change, ChangeFn, Doc } from 'automerge'

import { DocReader } from './DocReader'
import { downloadMeta, uploadMeta } from './loaders'
import {
  BzzInstance,
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

export class DocWriter<
  T,
  Bzz extends BzzInstance = BzzInstance
> extends DocReader<T, Bzz> {
  static create<T, Bzz extends BzzInstance = BzzInstance>(
    params: CreateDocWriterParams<Bzz>,
  ): DocWriter<T, Bzz> {
    const feeds = getDocFeeds(params.feed)
    return new DocWriter<T, Bzz>({
      bzz: params.bzz,
      doc: Automerge.init(),
      feed: feeds.meta,
      list: new DataListWriter<DataContent, Bzz>({
        bzz: params.bzz,
        feed: feeds.data,
      }),
    })
  }

  static async init<T, Bzz extends BzzInstance = BzzInstance>(
    params: InitDocWriterParams<T, Bzz>,
  ): Promise<DocWriter<T, Bzz>> {
    const feeds = getDocFeeds(params.feed)
    const writer = new DocWriter<T, Bzz>({
      bzz: params.bzz,
      doc: Automerge.from<T>(params.doc),
      feed: feeds.meta,
      list: new DataListWriter<DataContent, Bzz>({
        bzz: params.bzz,
        feed: feeds.data,
      }),
    })
    await writer.push()
    return writer
  }

  static fromJSON<T, Bzz extends BzzInstance = BzzInstance>(
    params: FromJSONDocParams<Bzz>,
  ): DocReader<T, Bzz> {
    return new DocWriter<T, Bzz>({
      bzz: params.bzz,
      doc: Automerge.load<T>(params.docString),
      feed: params.metaFeed,
      list: new DataListWriter<DataContent, Bzz>({
        bzz: params.bzz,
        feed: params.dataFeed,
      }),
    })
  }

  static async load<T, Bzz extends BzzInstance = BzzInstance>(
    params: LoadDocParams<Bzz>,
  ): Promise<DocReader<T, Bzz>> {
    const { bzz, feed } = params
    const doc = Automerge.init<T>()
    const meta = await downloadMeta(bzz, feed)
    const list = new DataListWriter<DataContent, Bzz>({
      bzz,
      feed: meta.dataFeed,
    })
    const writer = new DocWriter<T, Bzz>({ bzz, doc, feed, list })
    await writer.pull()
    return writer
  }

  protected list: DataListWriter<DataContent, Bzz>
  protected pushedDoc: Doc<T> | null = null
  protected pushQueue: Promise<string> | null = null

  public constructor(params: DocWriterParams<T, Bzz>) {
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
      this.pushedDoc || Automerge.init<T>(),
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
