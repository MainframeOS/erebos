import { DataListWriter } from '@erebos/feed-list'
import Automerge, { ChangeFn, Doc } from 'automerge'
import { Subject, Subscription, interval } from 'rxjs'

import { DocSubscriber } from './DocSubscriber'
import { DocWriter, getDocFeeds } from './DocWriter'
import { downloadMeta } from './loaders'
import {
  BzzInstance,
  DataContent,
  DocSynchronizerParams,
  DocSynchronizerSerialized,
  FromJSONDocSynchronizerParams,
  InitDocSynchronizerParams,
  LoadDocSynchronizerParams,
} from './types'

export class DocSynchronizer<T, Bzz extends BzzInstance> extends Subject<
  Doc<T>
> {
  static async init<T, Bzz extends BzzInstance = BzzInstance>(
    params: InitDocSynchronizerParams<T, Bzz>,
  ): Promise<DocSynchronizer<T, Bzz>> {
    const { bzz, pullInterval } = params
    const feeds = getDocFeeds(params.feed)
    const loadSources = (params.sources || []).map(async feed => {
      return await DocSubscriber.load<T, Bzz>({ bzz, feed, pullInterval })
    })
    const synchronizer = new DocSynchronizer<T, Bzz>({
      bzz,
      doc: Automerge.from<T>(params.doc),
      feed: feeds.meta,
      list: new DataListWriter<DataContent, Bzz>({
        bzz,
        feed: feeds.data,
      }),
      pushInterval: params.pushInterval,
      sources: await Promise.all(loadSources),
    })
    await synchronizer.push()
    return synchronizer
  }

  static fromJSON<T, Bzz extends BzzInstance = BzzInstance>(
    params: FromJSONDocSynchronizerParams<Bzz>,
  ): DocSynchronizer<T, Bzz> {
    const { bzz, pullInterval } = params
    const sources = (params.sources || []).map(sourceParams => {
      return DocSubscriber.fromJSON<T, Bzz>({
        ...sourceParams,
        bzz,
        pullInterval,
      })
    })
    return new DocSynchronizer<T, Bzz>({
      bzz,
      doc: Automerge.load<T>(params.docString),
      feed: params.metaFeed,
      list: new DataListWriter<DataContent, Bzz>({
        bzz: params.bzz,
        feed: params.dataFeed,
      }),
      sources,
      pushInterval: params.pushInterval,
    })
  }

  static async load<T, Bzz extends BzzInstance = BzzInstance>(
    params: LoadDocSynchronizerParams<Bzz>,
  ): Promise<DocSynchronizer<T, Bzz>> {
    const { bzz, feed, pullInterval } = params
    const loadSources = (params.sources || []).map(async sourceFeed => {
      return await DocSubscriber.load<T, Bzz>({
        bzz,
        feed: sourceFeed,
        pullInterval,
      })
    })
    const [meta, sources] = await Promise.all([
      downloadMeta(bzz, feed),
      Promise.all(loadSources),
    ])
    const synchronizer = new DocSynchronizer<T, Bzz>({
      bzz,
      doc: Automerge.init<T>(),
      feed,
      list: new DataListWriter<DataContent, Bzz>({
        bzz,
        feed: meta.dataFeed,
      }),
      pushInterval: params.pushInterval,
      sources,
    })
    await synchronizer.pull()
    return synchronizer
  }

  protected writer: DocWriter<T, Bzz>
  protected pushInterval: number | null
  protected sources: Array<DocSubscriber<T, Bzz>>
  protected subscription: Subscription | null = null

  constructor(params: DocSynchronizerParams<T, Bzz>) {
    super()
    this.writer = new DocWriter<T, Bzz>(params)
    this.writer.subscribe(this)
    this.pushInterval = params.pushInterval || null
    this.sources = params.sources || []
    this.start()
  }

  get value(): Doc<T> {
    return this.writer.value
  }

  public start(): void {
    this.stop()
    const sub = new Subscription()

    for (const source of this.sources) {
      sub.add(
        source.subscribe(doc => {
          this.writer.merge(doc)
        }),
      )
      source.start()
    }
    if (this.pushInterval != null) {
      sub.add(
        interval(this.pushInterval).subscribe(() => {
          this.writer.push()
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

  public change(updater: ChangeFn<T>): boolean {
    return this.writer.change(updater)
  }

  public async push(): Promise<string | null> {
    return await this.writer.push()
  }

  public async pull(): Promise<boolean> {
    return await this.writer.pull()
  }

  public async pullSources(): Promise<boolean> {
    const anyChanged = await Promise.all(this.sources.map(s => s.pull()))
    return anyChanged.find(Boolean) || false
  }

  public toJSON(): DocSynchronizerSerialized {
    const serialized = this.writer.toJSON()
    return {
      ...serialized,
      sources: this.sources.map(s => s.toJSON()),
    }
  }
}
