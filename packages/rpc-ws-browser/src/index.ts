import { StreamRPC } from '@erebos/rpc-stream'
import { createTransport } from '@erebos/transport-ws-browser'

export function createRPC<T = any>(url: string): StreamRPC {
  return new StreamRPC(createTransport<T>(url))
}
