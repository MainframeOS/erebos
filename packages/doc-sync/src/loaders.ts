import { FeedParams } from '@erebos/bzz-feed'
import { DataListReader } from '@erebos/feed-list'
import Automerge, { Doc } from 'automerge'

import { Bzz, DataContent, MetaContent } from './types'

export async function downloadMeta<B extends Bzz = Bzz>(
  bzzFeed: B,
  feed: FeedParams,
): Promise<MetaContent> {
  const res = await bzzFeed.getContent(feed, { mode: 'raw' })
  return await res.json<MetaContent>()
}

export async function uploadMeta<B extends Bzz = Bzz>(
  bzzFeed: B,
  feed: FeedParams,
  content: MetaContent,
): Promise<string> {
  return await bzzFeed.setContent(feed, JSON.stringify(content))
}

export async function downloadSnapshot<T, B extends Bzz = Bzz>(
  bzzFeed: B,
  hash: string,
): Promise<Doc<T>> {
  const res = await bzzFeed.bzz.download(hash, { mode: 'raw' })
  const text = await res.text()
  return Automerge.load<T>(text)
}

export async function downloadDoc<T, B extends Bzz = Bzz>(
  bzzFeed: B,
  feed: FeedParams,
  list: DataListReader<DataContent, B>,
): Promise<Doc<T>> {
  const meta = await downloadMeta(bzzFeed, feed)

  let doc = meta.snapshot
    ? await downloadSnapshot<T, B>(bzzFeed, meta.snapshot.hash)
    : Automerge.init<T>()

  const nextTime = meta.snapshot ? meta.snapshot.time + 1 : 0
  if ((meta.dataFeed.time as number) >= nextTime) {
    for await (const content of list.createForwardsIterator(nextTime)) {
      doc = Automerge.applyChanges(doc, content.changes)
    }
  }

  return doc
}
