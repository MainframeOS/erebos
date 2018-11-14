// @flow

import type { hexValue } from '@erebos/hex'

import type {
  RPC,
  ShhInfo,
  ShhFilterCriteria,
  ShhPostMessage,
  ShhReceivedMessage,
} from './types'

export default class Shh {
  _rpc: RPC

  constructor(rpc: RPC) {
    this._rpc = rpc
  }

  version(): Promise<string> {
    return this._rpc.request('shh_version')
  }

  info(): Promise<ShhInfo> {
    return this._rpc.request('shh_info')
  }

  setMaxMessageSize(size: number): Promise<boolean> {
    return this._rpc.request('shh_setMaxMessageSize', [size])
  }

  setMinPow(pow: number): Promise<boolean> {
    return this._rpc.request('shh_setMinPow', [pow])
  }

  setBloomFilter(bloom: hexValue): Promise<boolean> {
    return this._rpc.request('shh_setBloomFilter', [bloom])
  }

  markTrustedPeer(enode: string): Promise<boolean> {
    return this._rpc.request('shh_markTrustedPeer', [enode])
  }

  newKeyPair(): Promise<string> {
    return this._rpc.request('shh_newKeyPair')
  }

  addPrivateKey(key: hexValue): Promise<string> {
    return this._rpc.request('shh_addPrivateKey', [key])
  }

  deleteKeyPair(id: string): Promise<boolean> {
    return this._rpc.request('shh_deleteKeyPair', [id])
  }

  hasKeyPair(id: string): Promise<boolean> {
    return this._rpc.request('shh_hasKeyPair', [id])
  }

  getPublicKey(id: string): Promise<hexValue> {
    return this._rpc.request('shh_getPublicKey', [id])
  }

  getPrivateKey(id: string): Promise<hexValue> {
    return this._rpc.request('shh_getPrivateKey', [id])
  }

  newSymKey(): Promise<string> {
    return this._rpc.request('shh_newSymKey')
  }

  addSymKey(key: hexValue): Promise<string> {
    return this._rpc.request('shh_addSymKey', [key])
  }

  generateSymKeyFromPassword(password: string): Promise<string> {
    return this._rpc.request('shh_generateSymKeyFromPassword', [password])
  }

  hasSymKey(id: string): Promise<boolean> {
    return this._rpc.request('shh_hasSymKey', [id])
  }

  getSymKey(id: string): Promise<hexValue> {
    return this._rpc.request('shh_getSymKey', [id])
  }

  deleteSymKey(id: string): Promise<boolean> {
    return this._rpc.request('shh_deleteSymKey', [id])
  }

  post(msg: ShhPostMessage): Promise<boolean> {
    return this._rpc.request('shh_post', [msg])
  }

  getFilterMessages(id: string): Promise<Array<ShhReceivedMessage>> {
    return this._rpc.request('shh_getFilterMessages', [id])
  }

  deleteMessageFilter(id: string): Promise<boolean> {
    return this._rpc.request('shh_deleteMessageFilter', [id])
  }

  newMessageFilter(criteria: ShhFilterCriteria): Promise<string> {
    return this._rpc.request('shh_newMessageFilter', [criteria])
  }
}
