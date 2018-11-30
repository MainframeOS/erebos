// @flow

import createHex, {
  hexValueType,
  type Hex,
  type hexInput,
  type hexValue,
} from '@erebos/hex'
import type StreamRPC from '@mainframe/rpc-stream'
import { Observable } from 'rxjs'

const EMPTY_HEX = hexValueType('0x')

export type PssEvent = {
  key: hexValue,
  msg: Hex,
}

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

  baseAddr(): Promise<hexValue> {
    return this._rpc.request('pss_baseAddr')
  }

  getPublicKey(): Promise<hexValue> {
    return this._rpc.request('pss_getPublicKey')
  }

  sendAsym(
    key: hexValue,
    topic: hexValue,
    message: Hex | hexInput,
  ): Promise<null> {
    return this._rpc.request('pss_sendAsym', [
      key,
      topic,
      createHex(message).value,
    ])
  }

  sendSym(
    keyID: string,
    topic: hexValue,
    message: Hex | hexInput,
  ): Promise<null> {
    return this._rpc.request('pss_sendSym', [
      keyID,
      topic,
      createHex(message).value,
    ])
  }

  setPeerPublicKey(
    key: hexValue,
    topic: hexValue,
    address: hexValue = EMPTY_HEX,
  ): Promise<null> {
    return this._rpc.request('pss_setPeerPublicKey', [key, topic, address])
  }

  setSymmetricKey(
    key: hexValue,
    topic: hexValue,
    address: hexValue = EMPTY_HEX,
    useForDecryption: boolean = false,
  ): Promise<string> {
    return this._rpc.request('pss_setSymmetricKey', [
      key,
      topic,
      address,
      useForDecryption,
    ])
  }

  stringToTopic(str: string): Promise<hexValue> {
    return this._rpc.request('pss_stringToTopic', [str])
  }

  subscribeTopic(topic: hexValue): Promise<hexValue> {
    return this._rpc.request('pss_subscribe', ['receive', topic, false, false])
  }

  createSubscription(subscription: hexValue): Observable<PssEvent> {
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
                observer.next({
                  key: result.Key,
                  msg: createHex(result.Msg),
                })
              } catch (err) {
                // eslint-disable-next-line no-console
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

  createTopicSubscription(topic: hexValue): Promise<Observable<PssEvent>> {
    return this.subscribeTopic(topic).then(subscription =>
      this.createSubscription(subscription),
    )
  }
}
