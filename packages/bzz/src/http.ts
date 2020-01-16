import { Response } from './types'
import { toSwarmHash } from './utils'

export class HTTPError extends Error {
  public status: number

  public constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

export async function resOrError<R extends Response>(res: R): Promise<R> {
  if (res.ok) {
    return res
  }

  const messageMatches = /Message: (.*)$/m.exec(await res.text())
  if (messageMatches && messageMatches.length === 2) {
    throw new HTTPError(res.status, messageMatches[1])
  } else {
    throw new HTTPError(res.status, res.statusText)
  }
}

export async function resJSON<R extends Response, T = any>(res: R): Promise<T> {
  return (await resOrError(res)).json<T>()
}

export async function resText<R extends Response>(res: R): Promise<string> {
  return (await resOrError(res)).text()
}

export async function resArrayBuffer<R extends Response>(
  res: R,
): Promise<ArrayBuffer> {
  return (await resOrError(res)).arrayBuffer()
}

export async function resSwarmHash<R extends Response>(
  res: R,
): Promise<string> {
  const bytes = await resArrayBuffer<R>(res)
  return toSwarmHash(bytes)
}
