import { DataListWriter } from '@erebos/feed-list'
import Automerge from 'automerge'
import { Subscription, interval } from 'rxjs'

import { DocSubscriber } from './DocSubscriber'
import { DocWriter, getDocFeeds } from './DocWriter'
import { downloadMeta } from './loaders'
import {
  Bzz,
  DataPayload,
  DocSynchronizerParams,
  DocSynchronizerSerialized,
  FromJSONDocSynchronizerParams,
  InitDocSynchronizerParams,
  LoadDocSynchronizerParams,
} from './types'

export class DocSynchronizer<T, B extends Bzz = Bzz> extends DocWriter<T, B> {
  static async init<T, B extends Bzz = Bzz>(
    params: InitDocSynchronizerParams<T, B>,
  ): Promise<DocSynchronizer<T, B>> {
    const { bzz, pullInterval } = params
    const feeds = getDocFeeds(params.feed)
    const loadSources = (params.sources ?? []).map(async feed => {
      return await DocSubscriber.load<T, B>({ bzz, feed, pullInterval })
    })
    const synchronizer = new DocSynchronizer<T, B>({
      bzz,
      doc: Automerge.from<T>(params.doc),
      feed: feeds.meta,
      list: new DataListWriter<DataPayload, B>({
        bzz,
        feed: feeds.data,
      }),
      pushInterval: params.pushInterval,
      snapshotFrequency: params.snapshotFrequency,
      sources: await Promise.all(loadSources),
    })
    await synchronizer.push()
    return synchronizer
  }

  static fromJSON<T, B extends Bzz = Bzz>(
    params: FromJSONDocSynchronizerParams<B>,
  ): DocSynchronizer<T, B> {
    const { bzz, pullInterval } = params
    const sources = (params.sources ?? []).map(sourceParams => {
      return DocSubscriber.fromJSON<T, B>({
        ...sourceParams,
        bzz,
        pullInterval,
      })
    })
    return new DocSynchronizer<T, B>({
      bzz,
      doc: Automerge.load<T>(params.docString),
      feed: params.metaFeed,
      list: new DataListWriter<DataPayload, B>({
        bzz: params.bzz,
        feed: params.dataFeed,
      }),
      sources,
      pushInterval: params.pushInterval,
    })
  }

  static async load<T, B extends Bzz = Bzz>(
    params: LoadDocSynchronizerParams<B>,
  ): Promise<DocSynchronizer<T, B>> {
    const { bzz, feed, pullInterval } = params
    const loadSources = (params.sources ?? []).map(async sourceFeed => {
      return await DocSubscriber.load<T, B>({
        bzz,
        feed: sourceFeed,
        pullInterval,
      })
    })
    const [meta, sources] = await Promise.all([
      downloadMeta(bzz, feed),
      Promise.all(loadSources),
    ])
    const synchronizer = new DocSynchronizer<T, B>({
      bzz,
      doc: Automerge.init<T>(),
      feed,
      list: new DataListWriter<DataPayload, B>({
        bzz,
        feed: meta.dataFeed,
      }),
      pushInterval: params.pushInterval,
      sources,
    })
    await synchronizer.pull()
    return synchronizer
  }

  protected pushInterval: number | null
  protected sources: Array<DocSubscriber<T, B>>
  protected subscription: Subscription | null = null

  constructor(params: DocSynchronizerParams<T, B>) {
    super(params)
    this.pushInterval = params.pushInterval || null
    this.sources = params.sources ?? []
    this.start()
  }

  public start(): void {
    this.stop()
    const sub = new Subscription()

    for (const source of this.sources) {
      sub.add(
        source.subscribe(doc => {
          this.merge(doc)
        }),
      )
      source.start()
    }
    if (this.pushInterval != null) {
      sub.add(
        interval(this.pushInterval).subscribe(() => {
          this.push()
        }),
      )
    }

    this.subscription = sub
  }

  public stop(): void {
    if (this.subscription != null) {
      this.subscription.unsubscribe()
      this.subscription = null
    }
    for (const source of this.sources) {
      source.stop()
    }
  }

  public async pullSources(): Promise<boolean> {
    const changes = await Promise.all(this.sources.map(s => s.pull()))
    return changes.reduce((anyChanged, changed, index) => {
      if (changed) {
        this.merge(this.sources[index].value)
        return true
      }
      return anyChanged
    }, false)
  }

  public toJSON(): DocSynchronizerSerialized {
    const serialized = super.toJSON()
    return {
      ...serialized,
      sources: this.sources.map(s => s.toJSON()),
    }
  }
}
