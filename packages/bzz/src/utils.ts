import {
  Fetch,
  PinnedFile,
  PinResponse,
  Response,
  Tag,
  TagResponse,
} from './types'

export function formatPinnedFile(p: PinResponse): PinnedFile {
  return {
    address: p.Address,
    counter: p.PinCounter,
    raw: p.IsRaw,
    size: p.FileSize,
  }
}

export function formatTag(t: TagResponse): Tag {
  return {
    uid: t.Uid,
    name: t.Name,
    address: t.Address,
    total: t.Total,
    split: t.Split,
    seen: t.Seen,
    stored: t.Stored,
    sent: t.Sent,
    synced: t.Synced,
    startedAt: new Date(t.StartedAt),
  }
}

export function getGlobal(): typeof globalThis {
  // ES2020
  if (typeof globalThis !== 'undefined') {
    return globalThis
  }
  // Browser window
  if (typeof window !== 'undefined') {
    return window
  }
  // Web Worker
  if (typeof self !== 'undefined') {
    return self
  }
  throw new Error('Unable to get global object')
}

export function getGlobalFetch<R extends Response>(): Fetch<R> {
  return (getGlobal().fetch as any) as Fetch<R>
}

export function toSwarmHash(buffer: ArrayBuffer): string {
  return Buffer.from(new Uint8Array(buffer)).toString('hex')
}
