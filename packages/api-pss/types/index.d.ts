import { Hex, hexInput, hexValue } from '@erebos/hex'
import { Observable, Subject } from 'rxjs'

export interface StreamRPC extends Subject<Object> {}

export interface PssEvent {
  key: hexValue
  msg: Hex
}

export default class Pss {
  constructor(rpc: StreamRPC)
  baseAddr(): Promise<hexValue>
  getPublicKey(): Promise<hexValue>
  sendAsym(
    key: hexValue,
    topic: hexValue,
    message: Hex | hexInput,
  ): Promise<null>
  sendSym(
    keyID: string,
    topic: hexValue,
    message: Hex | hexInput,
  ): Promise<null>
  setPeerPublicKey(
    key: hexValue,
    topic: hexValue,
    address?: hexValue,
  ): Promise<null>
  setSymmetricKey(
    key: hexValue,
    topic: hexValue,
    address?: hexValue,
    useForDecryption?: boolean,
  ): Promise<string>
  stringToTopic(str: string): Promise<hexValue>
  subscribeTopic(topic: hexValue): Promise<hexValue>
  createSubscription(subscription: hexValue): Observable<PssEvent>
  createTopicSubscription(topic: hexValue): Promise<Observable<PssEvent>>
}
