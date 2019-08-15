import { RequestRPC } from '@erebos/rpc-request'
import { createTransport } from '@erebos/transport-http-node'

export function createRPC(url: string): RequestRPC {
  return new RequestRPC(createTransport(url))
}
