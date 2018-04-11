// @flow

import type StreamRPC from '@mainframe/rpc-stream'
import { hexEmpty, type hex } from '@mainframe/utils-hex'
import { Observable } from 'rxjs/Observable'

export default class Pss {
  _rpc: StreamRPC

  constructor(rpc: StreamRPC) {
    if (!rpc.canSubscribe) {
      throw new Error(
        'Invalid RPC instance provided: must support subscriptions',
      )
    }
    this._rpc = rpc
  }

  baseAddr(): Promise<hex> {
    return this._rpc.request('pss_baseAddr')
  }

  getPublicKey(): Promise<hex> {
    return this._rpc.request('pss_getPublicKey')
  }

  sendAsym(key: hex, topic: hex, message: hex): Promise<null> {
    return this._rpc.request('pss_sendAsym', [key, topic, message])
  }

  sendSym(keyID: string, topic: hex, message: hex): Promise<null> {
    return this._rpc.request('pss_sendSym', [keyID, topic, message])
  }

  setPeerPublicKey(
    key: hex,
    topic: hex,
    address: hex = hexEmpty,
  ): Promise<null> {
    return this._rpc.request('pss_setPeerPublicKey', [key, topic, address])
  }

  setSymmetricKey(
    key: hex,
    topic: hex,
    address: hex = hexEmpty,
    useForDecryption: boolean = false,
  ): Promise<string> {
    return this._rpc.request('pss_setSymmetricKey', [
      key,
      topic,
      address,
      useForDecryption,
    ])
  }

  stringToTopic(str: string): Promise<hex> {
    return this._rpc.request('pss_stringToTopic', [str])
  }

  subscribeTopic(topic: hex): Promise<hex> {
    return this._rpc.request('pss_subscribe', ['receive', topic])
  }

  createSubscription(subscription: hex): Observable<Object> {
    return Observable.create(observer => {
      return this._rpc.subscribe({
        next: msg => {
          if (
            msg.method === 'pss_subscription' &&
            msg.params != null &&
            msg.params.subscription === subscription
          ) {
            const { result } = msg.params
            if (result != null) {
              try {
                observer.next(result)
              } catch (err) {
                console.warn('Error handling message', result, err)
              }
            }
          }
        },
        error: err => {
          observer.error(err)
        },
        complete: () => {
          observer.complete()
        },
      })
    })
  }

  createTopicSubscription(topic: hex): Promise<Observable<Object>> {
    return this.subscribeTopic(topic).then(subscription =>
      this.createSubscription(subscription),
    )
  }
}
