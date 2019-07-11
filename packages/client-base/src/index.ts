import BaseRPC from '@mainframe/rpc-base'
import StreamRPC from '@mainframe/rpc-stream'

export interface ClientConfig {
  http?: string
  ipc?: string
  rpc?: StreamRPC
  ws?: string
}

export type InstantiateAPI<T> = (
  maybeInstance: string | T | void,
  Cls: { new (): T },
) => T | void

type CreateRPC<T extends BaseRPC> = (endpoint: string) => T

export function createInstantiateAPI<R extends BaseRPC>(
  createRPC: CreateRPC<R>,
) {
  return function instantiateAPI<T>(
    maybeInstance: string | T | void,
    Cls: { new (rpc: R): T },
  ): T | void {
    if (maybeInstance instanceof Cls) {
      return maybeInstance
    }
    if (typeof maybeInstance === 'string') {
      return new Cls(createRPC(maybeInstance) as R)
    }
  }
}

export abstract class BaseClient {
  protected rpcInstance: StreamRPC | void

  public constructor(config: ClientConfig = {}) {
    this.rpcInstance = config.rpc
  }

  public get rpc(): StreamRPC {
    if (this.rpcInstance == null) {
      throw new Error(
        'Could not access RPC: missing in configuration provided to client',
      )
    }
    return this.rpcInstance
  }

  public disconnect() {
    if (
      this.rpcInstance != null &&
      typeof this.rpcInstance.disconnect === 'function'
    ) {
      this.rpcInstance.disconnect()
    }
  }
}
