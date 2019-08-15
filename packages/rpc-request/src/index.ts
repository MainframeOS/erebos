import { BaseRPC } from '@erebos/rpc-base'
import { RPCError } from '@erebos/rpc-error'

export type FetchFunction = <D = any, R = any>(data: D) => Promise<R>

export class RequestRPC extends BaseRPC {
  private fetch: FetchFunction

  public constructor(fetch: FetchFunction) {
    super(false)
    this.fetch = fetch
  }

  public request<P = any, R = any, E = any>(
    method: string,
    params?: P,
  ): Promise<R> {
    return this.fetch({
      id: this.createID(),
      jsonrpc: '2.0',
      method,
      params,
    }).then(msg => {
      if (msg.error) {
        throw RPCError.fromObject<E>(msg.error)
      }
      return msg.result
    })
  }
}
