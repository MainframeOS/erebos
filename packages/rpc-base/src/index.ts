import nanoid from 'nanoid'

export type RPCID = string | number | null

export interface RPCRequest<T = any> {
  jsonrpc: '2.0'
  method: string
  id?: RPCID
  params?: T | undefined
}

export interface RPCErrorObject<T = any> {
  code: number
  message?: string | undefined
  data?: T
}

export interface RPCResponse<T = any, E = any> {
  jsonrpc: '2.0'
  id?: RPCID
  result?: T
  error?: RPCErrorObject<E>
}

export abstract class BaseRPC {
  public readonly canSubscribe: boolean

  public constructor(canSubscribe = false) {
    this.canSubscribe = canSubscribe
  }

  public createID(): string {
    return nanoid()
  }

  abstract request<P = any, R = any>(method: string, params?: P): Promise<R>
}
