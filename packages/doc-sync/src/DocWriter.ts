import { getFeedTopic } from '@erebos/bzz-feed'
import { hexValue } from '@erebos/hex'
import { DataListWriter } from '@erebos/feed-list'
import Automerge, { Change, ChangeFn, Doc } from 'automerge'

import { DocReader } from './DocReader'
import {
  PROTOCOL,
  downloadMeta,
  uploadData,
  uploadMeta,
  uploadSnapshot,
} from './loaders'
import {
  Bzz,
  CreateDocWriterParams,
  DataPayload,
  DocFeeds,
  DocSerialized,
  DocWriterParams,
  FeedFactoryParams,
  FromJSONDocWriterParams,
  InitDocWriterParams,
  LoadDocWriterParams,
  MetaSnapshot,
} from './types'

export const DATA_FEED_NAME = `${PROTOCOL}/data`
export const META_FEED_NAME = `${PROTOCOL}/meta`

export function getDocFeeds(feed: FeedFactoryParams): DocFeeds {
  return {
    data: {
      user: feed.user as hexValue,
      topic: getFeedTopic({ topic: feed.topic, name: DATA_FEED_NAME }),
    },
    meta: {
      user: feed.user as hexValue,
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
      list: new DataListWriter<DataPayload, B>({
        bzz: params.bzz,
        feed: feeds.data,
        signParams: params.signParams,
      }),
      signParams: params.signParams,
      snapshotFrequency: params.snapshotFrequency,
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
      list: new DataListWriter<DataPayload, B>({
        bzz: params.bzz,
        feed: feeds.data,
        signParams: params.signParams,
      }),
      signParams: params.signParams,
      snapshotFrequency: params.snapshotFrequency,
    })
    await writer.push()
    return writer
  }

  static fromJSON<T, B extends Bzz = Bzz>(
    params: FromJSONDocWriterParams<B>,
  ): DocWriter<T, B> {
    return new DocWriter<T, B>({
      bzz: params.bzz,
      doc: Automerge.load<T>(params.docString),
      feed: params.metaFeed,
      list: new DataListWriter<DataPayload, B>({
        bzz: params.bzz,
        feed: params.dataFeed,
        signParams: params.signParams,
      }),
      signParams: params.signParams,
      snapshotFrequency: params.snapshotFrequency,
    })
  }

  static async load<T, B extends Bzz = Bzz>(
    params: LoadDocWriterParams<B>,
  ): Promise<DocWriter<T, B>> {
    const { bzz, feed, signParams, snapshotFrequency } = params
    const doc = Automerge.init<T>()
    const meta = await downloadMeta(bzz, feed)
    const list = new DataListWriter<DataPayload, B>({
      bzz,
      feed: meta.dataFeed,
      signParams,
    })
    const writer = new DocWriter<T, B>({
      bzz,
      doc,
      feed,
      list,
      signParams,
      snapshotFrequency,
    })
    await writer.pull()
    return writer
  }

  protected list: DataListWriter<DataPayload, B>
  protected pushedDoc: Doc<T> | null = null
  protected pushQueue: Promise<string> | null = null
  protected signParams: any | undefined
  protected snapshot: MetaSnapshot | undefined
  protected snapshotFrequency: number | null

  public constructor(params: DocWriterParams<T, B>) {
    super({ ...params, time: params.list.length })
    this.list = params.list
    this.signParams = params.signParams
    this.snapshotFrequency = params.snapshotFrequency || null
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

    // Upload the changes
    await uploadData(this.list, { changes })
    this.pushedDoc = doc
    const dataFeed = this.list.getID().params

    // Upload a snapshot if needed based on the configuration
    const time = dataFeed.time ?? -1
    if (
      this.snapshotFrequency != null &&
      time > 0 &&
      time % this.snapshotFrequency === 0
    ) {
      this.snapshot = { hash: await uploadSnapshot(this.bzz, doc), time }
    }

    // Update the metadata
    return await uploadMeta(
      this.bzz,
      this.feed,
      { dataFeed, snapshot: this.snapshot },
      this.signParams,
    )
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
