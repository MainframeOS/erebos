import { Observable, Subject, Subscriber, Subscription, Observer } from 'rxjs'

import { BaseRPC, RPCRequest, RPCResponse } from '@erebos/rpc-base'
import { RPCError } from '@erebos/rpc-error'

export class StreamRPC extends BaseRPC {
  private _observers: Map<string, Subscriber<any>>
  private _subscribers: Set<Subscriber<any>>
  private _subscription: Subscription | undefined
  private _transport: Subject<any>

  public constructor(transport: Subject<any>) {
    super(true)
    this._observers = new Map()
    this._subscribers = new Set()
    this._transport = transport
    this.connect()
  }

  public get connected(): boolean {
    return this._subscription != null && !this._subscription.closed
  }

  public connect(): void {
    if (this.connected) {
      return
    }

    let failed
    this._subscription = this._transport.subscribe({
      next: (msg: RPCResponse) => {
        if (msg.id == null) {
          this._subscribers.forEach(o => {
            o.next(msg)
          })
        } else {
          const observer = this._observers.get(String(msg.id))
          if (observer != null) {
            if (msg.error != null) {
              const err = RPCError.fromObject(msg.error)
              observer.error(err)
              if (msg.id != null) {
                this._observers.delete(String(msg.id))
              }
            } else {
              observer.next(msg.result)
            }
          } else {
            // eslint-disable-next-line no-console
            console.warn('Missing observer for message ID:', msg.id)
          }
        }
      },
      error: event => {
        let err: Error | undefined
        if (event instanceof Error) {
          err = event
        } else {
          err = new Error('Connection failed')
        }
        failed = err

        this._observers.forEach(o => {
          o.error(err)
        })
        this._observers.clear()
        this._subscribers.forEach(o => {
          o.error(err)
        })
        this._subscribers.clear()
      },
      complete: () => {
        this._observers.forEach(o => {
          o.complete()
        })
        this._observers.clear()
        this._subscribers.forEach(o => {
          o.complete()
        })
        this._subscribers.clear()
      },
    })

    if (failed != null) {
      throw failed
    }
  }

  public disconnect(): void {
    this._transport.complete()
  }

  public observe<P = any, R = any>(method: string, params?: P): Observable<R> {
    return Observable.create((observer: Observer<R>) => {
      const id = this.createID()
      const msg: RPCRequest = { jsonrpc: '2.0', method, id, params }
      this._observers.set(id, new Subscriber(observer))
      this._transport.next(msg)
      return () => {
        this._observers.delete(id)
      }
    })
  }

  public request<P = any, R = any>(method: string, params?: P): Promise<R> {
    return new Promise((resolve, reject) => {
      if (this.connected) {
        const sub = this.observe(method, params).subscribe(
          (value: R) => {
            sub.unsubscribe()
            resolve(value)
          },
          err => {
            sub.unsubscribe()
            reject(err)
          },
          () => {
            sub.unsubscribe()
          },
        )
      } else {
        reject(new Error('Not connected'))
      }
    })
  }

  public notify(method: string, params?: any): void {
    this._transport.next({ jsonrpc: '2.0', method, params })
  }

  public subscribe(...args: Array<any>): () => void {
    if (!this.connected) {
      throw new Error('Not connected')
    }

    const subscriber = new Subscriber(...args)
    this._subscribers.add(subscriber)
    return () => {
      this._subscribers.delete(subscriber)
    }
  }
}
