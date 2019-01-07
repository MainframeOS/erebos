import { StreamRPC } from '@erebos/api-pss'

export interface ClientConfig {
  http?: string
  ipc?: string
  rpc?: StreamRPC
  ws?: string
}

export default abstract class BaseClient {
  constructor(config: ClientConfig)
  rpc: StreamRPC
  disconnect(): void
}
