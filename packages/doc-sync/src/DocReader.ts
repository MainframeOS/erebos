import { FeedParams } from '@erebos/api-bzz-base'
import { DataListReader } from '@erebos/feed-list'
import Automerge, { Doc } from 'automerge'
import { BehaviorSubject } from 'rxjs'

import { downloadDoc, downloadMeta } from './loaders'
import {
  BzzInstance,
  DataContent,
  DocReaderParams,
  DocSerialized,
  FromJSONDocParams,
  LoadDocParams,
} from './types'

export class DocReader<
  T,
  Bzz extends BzzInstance = BzzInstance
> extends BehaviorSubject<Doc<T>> {
  static fromJSON<T, Bzz extends BzzInstance = BzzInstance>(
    params: FromJSONDocParams<Bzz>,
  ): DocReader<T, Bzz> {
    return new DocReader<T, Bzz>({
      bzz: params.bzz,
      doc: Automerge.load<T>(params.docString),
      feed: params.metaFeed,
      list: new DataListReader<DataContent, Bzz>({
        bzz: params.bzz,
        feed: params.dataFeed,
      }),
      time: params.dataFeed.time || -1,
    })
  }

  static async load<T, Bzz extends BzzInstance = BzzInstance>(
    params: LoadDocParams<Bzz>,
  ): Promise<DocReader<T, Bzz>> {
    const { bzz, feed } = params
    const meta = await downloadMeta(bzz, feed)
    const reader = new DocReader<T, Bzz>({
      bzz,
      doc: Automerge.init<T>(),
      feed,
      list: new DataListReader<DataContent, Bzz>({
        bzz,
        feed: meta.dataFeed,
      }),
      time: -1,
    })
    await reader.pull()
    return reader
  }

  protected bzz: Bzz
  protected feed: FeedParams
  protected list: DataListReader<DataContent, Bzz>
  protected time: number
  private pullPromise: Promise<boolean> | null = null

  constructor(params: DocReaderParams<T, Bzz>) {
    super(params.doc)
    this.bzz = params.bzz
    this.feed = params.feed
    this.list = params.list
    this.time = params.time
  }

  public get metaFeed(): FeedParams {
    return this.feed
  }

  protected write(doc: Doc<T>): boolean {
    const changes = Automerge.diff(this.value, doc)
    if (changes.length === 0) {
      return false
    } else {
      this.next(doc)
      return true
    }
  }

  protected async load(): Promise<boolean> {
    const doc = await downloadDoc<T, Bzz>(this.bzz, this.feed, this.list)
    return this.write(doc)
  }

  public async pull(): Promise<boolean> {
    if (this.pullPromise != null) {
      return await this.pullPromise
    }

    this.pullPromise = this.load()
    const changed = await this.pullPromise
    this.pullPromise = null
    return changed
  }

  public toJSON(): DocSerialized {
    const dataParams = this.list.getID().params
    return {
      docString: Automerge.save(this.value),
      dataFeed: { ...dataParams, time: this.time },
      metaFeed: this.feed,
    }
  }
}
