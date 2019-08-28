import { createRPC as createHTTP } from '@erebos/rpc-http-node'
import { createRPC as createIPC } from '@erebos/rpc-ipc'
import { createRPC as createWS } from '@erebos/rpc-ws-node'

const HTTP_RE = /^https?:\/\//i
const WS_RE = /^wss?:\/\//i

type RPC =
  | ReturnType<typeof createHTTP>
  | ReturnType<typeof createIPC>
  | ReturnType<typeof createWS>

export function createRPC(endpoint: string): RPC {
  if (HTTP_RE.test(endpoint)) {
    return createHTTP(endpoint)
  }
  if (WS_RE.test(endpoint)) {
    return createIPC(endpoint)
  }
  return createWS(endpoint)
}
