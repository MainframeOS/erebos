import { StreamRPC } from '@erebos/rpc-stream'
import { createTransport, PathOrConfig } from '@erebos/transport-ipc'

export function createRPC<T>(pathOrConfig: PathOrConfig): StreamRPC {
  return new StreamRPC(createTransport<T>(pathOrConfig))
}
