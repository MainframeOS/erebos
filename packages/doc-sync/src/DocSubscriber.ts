import { DataListReader } from '@erebos/feed-list'
import Automerge from 'automerge'
import { Subscription, interval } from 'rxjs'

import { DocReader } from './DocReader'
import { downloadMeta } from './loaders'
import {
  BzzInstance,
  DataContent,
  DocSubscriberParams,
  FromJSONDocSubscriberParams,
  LoadDocSubscriberParams,
} from './types'

export class DocSubscriber<
  T,
  Bzz extends BzzInstance = BzzInstance
> extends DocReader<T, Bzz> {
  static fromJSON<T, Bzz extends BzzInstance = BzzInstance>(
    params: FromJSONDocSubscriberParams<Bzz>,
  ): DocSubscriber<T, Bzz> {
    return new DocSubscriber<T, Bzz>({
      bzz: params.bzz,
      doc: Automerge.load<T>(params.docString),
      feed: params.metaFeed,
      list: new DataListReader<DataContent, Bzz>({
        bzz: params.bzz,
        feed: params.dataFeed,
      }),
      time: params.dataFeed.time || -1,
      pullInterval: params.pullInterval,
    })
  }

  static async load<T, Bzz extends BzzInstance = BzzInstance>(
    params: LoadDocSubscriberParams<Bzz>,
  ): Promise<DocSubscriber<T, Bzz>> {
    const { bzz, feed } = params
    const meta = await downloadMeta(bzz, feed)
    const subscriber = new DocSubscriber<T, Bzz>({
      bzz,
      doc: Automerge.init<T>(),
      feed,
      list: new DataListReader<DataContent, Bzz>({
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

  constructor(params: DocSubscriberParams<T, Bzz>) {
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
