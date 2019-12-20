import { FeedParams } from '@erebos/api-bzz-base'
import { DataListReader } from '@erebos/feed-list'
import Automerge, { Doc } from 'automerge'

import { BzzInstance, DataContent, MetaContent } from './types'

export async function downloadMeta<Bzz extends BzzInstance = BzzInstance>(
  bzz: Bzz,
  feed: FeedParams,
): Promise<MetaContent> {
  const res = await bzz.getFeedContent(feed, { mode: 'raw' })
  return await res.json<MetaContent>()
}

export async function uploadMeta<Bzz extends BzzInstance = BzzInstance>(
  bzz: Bzz,
  feed: FeedParams,
  content: MetaContent,
): Promise<string> {
  return await bzz.setFeedContent(feed, JSON.stringify(content))
}

export async function downloadSnapshot<
  T,
  Bzz extends BzzInstance = BzzInstance
>(bzz: Bzz, hash: string): Promise<Doc<T>> {
  const res = await bzz.download(hash, { mode: 'raw' })
  const text = await res.text()
  return Automerge.load<T>(text)
}

export async function downloadDoc<T, Bzz extends BzzInstance = BzzInstance>(
  bzz: Bzz,
  feed: FeedParams,
  list: DataListReader<DataContent, Bzz>,
): Promise<Doc<T>> {
  const meta = await downloadMeta(bzz, feed)

  let doc = meta.snapshot
    ? await downloadSnapshot<T, Bzz>(bzz, meta.snapshot.hash)
    : Automerge.init<T>()

  const nextTime = meta.snapshot ? meta.snapshot.time + 1 : 0
  if ((meta.dataFeed.time as number) >= nextTime) {
    for await (const content of list.createForwardsIterator(nextTime)) {
      doc = Automerge.applyChanges(doc, content.changes)
    }
  }

  return doc
}
