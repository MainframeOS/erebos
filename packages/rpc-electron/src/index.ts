import { StreamRPC } from '@erebos/rpc-stream'
import { createTransport } from '@erebos/transport-electron'

export function createRPC(channel?: string | undefined): StreamRPC {
  return new StreamRPC(createTransport(channel))
}
