// @flow

import { Observable } from 'rxjs/Observable'

import type RPC from './RPC'
import type { base64, byteArray, hex } from './utils'

export type topic = [number, number, number, number]

export default class PSS {
  _rpc: RPC

  constructor(rpc: RPC) {
    this._rpc = rpc
  }

  getBaseAddr(): Promise<base64> {
    return this._rpc.promise('pss_baseAddr')
  }

  getPublicKey(): Promise<base64> {
    return this._rpc.promise('pss_getPublicKey')
  }

  sendAsym(key: hex, topic: topic, message: byteArray): Promise<null> {
    return this._rpc.promise('pss_sendAsym', [key, topic, message])
  }

  sendSym(keyID: string, topic: topic, message: byteArray): Promise<null> {
    return this._rpc.promise('pss_sendSym', [keyID, topic, message])
  }

  setPeerPublicKey(
    key: byteArray,
    topic: topic,
    address: string = '',
  ): Promise<null> {
    return this._rpc.promise('pss_setPeerPublicKey', [key, topic, address])
  }

  setSymmetricKey(
    key: byteArray,
    topic: topic,
    address: string = '',
    useForDecryption: boolean = false,
  ): Promise<string> {
    return this._rpc.promise('pss_setSymmetricKey', [
      key,
      topic,
      address,
      useForDecryption,
    ])
  }

  stringToTopic(str: string): Promise<topic> {
    return this._rpc.promise('pss_stringToTopic', [str])
  }

  subscribeTopic(topic: topic): Promise<hex> {
    return this._rpc.promise('pss_subscribe', ['receive', topic])
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

  async createTopicSubscription(topic: topic): Promise<Observable<Object>> {
    const subscription = await this.subscribeTopic(topic)
    return this.createSubscription(subscription)
  }
}
