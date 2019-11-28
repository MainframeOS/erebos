import { Hex, createHex, hexInput, hexValue } from '@erebos/hex'
import { StreamRPC } from '@erebos/rpc-stream'
import { Observable, Observer } from 'rxjs'

export const EMPTY_ADDRESS: hexValue = '0x' as hexValue

export interface PssEvent {
  key?: hexValue
  msg: Hex
}

interface SubscriptionMessage {
  method?: string
  params?: Record<string, any>
}

export class Pss {
  protected rpc: StreamRPC

  public constructor(rpc: StreamRPC) {
    if (!rpc.canSubscribe) {
      throw new Error(
        'Invalid RPC instance provided: must support subscriptions',
      )
    }
    this.rpc = rpc
  }

  public async baseAddr(): Promise<hexValue> {
    return await this.rpc.request('pss_baseAddr')
  }

  public async getPublicKey(): Promise<hexValue> {
    return this.rpc.request('pss_getPublicKey')
  }

  public async sendAsym(
    key: hexValue,
    topic: hexValue,
    message: Hex | hexInput,
  ): Promise<null> {
    return await this.rpc.request('pss_sendAsym', [
      key,
      topic,
      createHex(message).value,
    ])
  }

  public async sendSym(
    keyID: string,
    topic: hexValue,
    message: Hex | hexInput,
  ): Promise<null> {
    return await this.rpc.request('pss_sendSym', [
      keyID,
      topic,
      createHex(message).value,
    ])
  }

  public async sendRaw(
    address: hexValue,
    topic: hexValue,
    message: Hex | hexInput,
  ): Promise<null> {
    return await this.rpc.request('pss_sendRaw', [
      address,
      topic,
      createHex(message).value,
    ])
  }

  public async setPeerPublicKey(
    key: hexValue,
    topic: hexValue,
    address: hexValue,
  ): Promise<null> {
    return await this.rpc.request('pss_setPeerPublicKey', [key, topic, address])
  }

  public async setSymmetricKey(
    key: hexValue,
    topic: hexValue,
    address: hexValue,
    useForDecryption = false,
  ): Promise<string> {
    return await this.rpc.request('pss_setSymmetricKey', [
      key,
      topic,
      address,
      useForDecryption,
    ])
  }

  public async stringToTopic(str: string): Promise<hexValue> {
    return await this.rpc.request('pss_stringToTopic', [str])
  }

  public async subscribeTopic(
    topic: hexValue,
    handleRawMessages = false,
  ): Promise<hexValue> {
    return await this.rpc.request('pss_subscribe', [
      'receive',
      topic,
      handleRawMessages,
      false,
    ])
  }

  public createSubscription(subscription: hexValue): Observable<PssEvent> {
    return Observable.create((observer: Observer<PssEvent>) => {
      this.rpc.subscribe({
        next: (msg: SubscriptionMessage) => {
          if (
            msg.method === 'pss_subscription' &&
            msg.params != null &&
            msg.params.subscription === subscription
          ) {
            const { result } = msg.params
            if (result != null) {
              try {
                observer.next({
                  key: result.Key && result.Key.length ? result.Key : undefined,
                  msg: createHex(result.Msg),
                })
              } catch (err) {
                // eslint-disable-next-line no-console
                console.warn('Error handling message', result, err)
              }
            }
          }
        },
        error: (err: Error) => {
          observer.error(err)
        },
        complete: () => {
          observer.complete()
        },
      })
    })
  }

  public async createTopicSubscription(
    topic: hexValue,
    handleRawMessages?: boolean,
  ): Promise<Observable<PssEvent>> {
    const subscription = await this.subscribeTopic(topic, handleRawMessages)
    return this.createSubscription(subscription)
  }
}
