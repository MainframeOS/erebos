import { createRPC as createHTTP } from '@erebos/rpc-http-browser'
import { createRPC as createWS } from '@erebos/rpc-ws-browser'

const HTTP_RE = /^https?:\/\//i
const WS_RE = /^wss?:\/\//i

export function createRPC(
  endpoint: string,
): ReturnType<typeof createHTTP> | ReturnType<typeof createWS> {
  if (HTTP_RE.test(endpoint)) {
    return createHTTP(endpoint)
  }
  if (WS_RE.test(endpoint)) {
    return createWS(endpoint)
  }
  throw new Error('Invalid endpoint provided: expecting HTTP or WebSocket URL')
}
