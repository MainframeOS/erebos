import { FeedParams } from '@erebos/bzz-feed'
import { DataListReader, DataListWriter } from '@erebos/feed-list'
import Automerge, { Doc } from 'automerge'

import {
  Bzz,
  DataContent,
  DataPayload,
  MetaContent,
  MetaPayload,
  ProtocolContent,
} from './types'

export const PROTOCOL = 'docsync'
export const VERSION = '1.0.0'

export function validateProtocol<T extends ProtocolContent>(content: T): T {
  if (content.protocol !== PROTOCOL) {
    throw new Error('Invalid protocol')
  }
  if (content.version !== VERSION) {
    throw new Error('Invalid version')
  }
  return content
}

export async function uploadData<B extends Bzz = Bzz>(
  list: DataListWriter<DataPayload, B>,
  content: DataContent,
): Promise<void> {
  return await list.push({ protocol: PROTOCOL, version: VERSION, ...content })
}

export async function downloadMeta<B extends Bzz = Bzz>(
  bzzFeed: B,
  feed: FeedParams,
): Promise<MetaPayload> {
  const res = await bzzFeed.getContent(feed, { mode: 'raw' })
  const payload = await res.json<MetaPayload>()
  return validateProtocol<MetaPayload>(payload)
}

export async function uploadMeta<B extends Bzz = Bzz>(
  bzzFeed: B,
  feed: FeedParams,
  content: MetaContent,
): Promise<string> {
  const payload = { protocol: PROTOCOL, version: VERSION, ...content }
  return await bzzFeed.setContent(feed, JSON.stringify(payload))
}

export async function downloadSnapshot<T, B extends Bzz = Bzz>(
  bzzFeed: B,
  hash: string,
): Promise<Doc<T>> {
  const res = await bzzFeed.bzz.download(hash, { mode: 'raw' })
  const text = await res.text()
  return Automerge.load<T>(text)
}

export async function uploadSnapshot<T, B extends Bzz = Bzz>(
  bzzFeed: B,
  doc: Doc<T>,
): Promise<string> {
  return await bzzFeed.bzz.uploadFile(Automerge.save(doc))
}

export async function downloadDoc<T, B extends Bzz = Bzz>(
  bzzFeed: B,
  feed: FeedParams,
  list: DataListReader<DataPayload, B>,
): Promise<Doc<T>> {
  const meta = await downloadMeta(bzzFeed, feed)

  let doc = Automerge.init<T>()
  let nextTime = 0
  if (meta.snapshot != null) {
    try {
      doc = await downloadSnapshot<T, B>(bzzFeed, meta.snapshot.hash)
      nextTime = meta.snapshot.time + 1
    } catch {
      // Ignore snapshot if it can't be loaded
    }
  }

  if ((meta.dataFeed.time as number) >= nextTime) {
    for await (const payload of list.createForwardsIterator(nextTime)) {
      doc = Automerge.applyChanges(doc, validateProtocol(payload).changes)
    }
  }

  return doc
}
