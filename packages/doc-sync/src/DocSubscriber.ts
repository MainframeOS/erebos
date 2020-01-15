import { DataListReader } from '@erebos/feed-list'
import Automerge from 'automerge'
import { Subscription, interval } from 'rxjs'

import { DocReader } from './DocReader'
import { downloadMeta } from './loaders'
import {
  Bzz,
  DataPayload,
  DocSubscriberParams,
  FromJSONDocSubscriberParams,
  LoadDocSubscriberParams,
} from './types'

export class DocSubscriber<T, B extends Bzz = Bzz> extends DocReader<T, B> {
  static fromJSON<T, B extends Bzz = Bzz>(
    params: FromJSONDocSubscriberParams<B>,
  ): DocSubscriber<T, B> {
    return new DocSubscriber<T, B>({
      bzz: params.bzz,
      doc: Automerge.load<T>(params.docString),
      feed: params.metaFeed,
      list: new DataListReader<DataPayload, B>({
        bzz: params.bzz,
        feed: params.dataFeed,
      }),
      time: params.dataFeed.time || -1,
      pullInterval: params.pullInterval,
    })
  }

  static async load<T, B extends Bzz = Bzz>(
    params: LoadDocSubscriberParams<B>,
  ): Promise<DocSubscriber<T, B>> {
    const { bzz, feed } = params
    const meta = await downloadMeta(bzz, feed)
    const subscriber = new DocSubscriber<T, B>({
      bzz,
      doc: Automerge.init<T>(),
      feed,
      list: new DataListReader<DataPayload, B>({
        bzz,
        feed: meta.dataFeed,
      }),
      time: meta.dataFeed.time || -1,
      pullInterval: params.pullInterval,
    })
    await subscriber.pull()
    return subscriber
  }

  private pullInterval: number
  private subscription: Subscription | null = null

  constructor(params: DocSubscriberParams<T, B>) {
    super(params)
    this.pullInterval = params.pullInterval
    this.start()
  }

  public start(): void {
    if (this.subscription == null) {
      this.subscription = interval(this.pullInterval).subscribe(() => {
        this.pull()
      })
    }
  }

  public stop(): void {
    if (this.subscription != null) {
      this.subscription.unsubscribe()
      this.subscription = null
    }
  }
}
