import fetch, { Response } from 'node-fetch'

const HEADERS = {
  Accept: 'application/json',
  'Content-Type': 'application/json',
}

const METHOD = 'POST'

export class HTTPError extends Error {
  public status: number

  public constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

export function resOrError(res: Response): Response {
  if (res.ok) {
    return res
  }
  throw new HTTPError(res.status, res.statusText)
}

type RequestFunction = <D = any, R = any>(data: D) => Promise<R>

export function createTransport(url: string): RequestFunction {
  return async function request<D = any, R = any>(data: D): Promise<R> {
    const request = {
      body: JSON.stringify(data),
      headers: HEADERS,
      method: METHOD,
    }
    const res = resOrError(await fetch(url, request))
    return await res.json()
  }
}
