// @flow

import type { hexValue } from '@erebos/hex'
import type { default as RPCType } from '@mainframe/rpc-base'

export type RPC = RPCType

export type ShhInfo = {
  memory: number,
  messages: number,
  minPow: number,
  maxMessageSize: number,
}

export type ShhFilterCriteria = {
  symKeyID?: string,
  privateKeyID?: string,
  sig?: hexValue,
  minPow?: number,
  topics: Array<hexValue>,
  allowP2P?: boolean,
}

export type ShhPostMessage = {
  symKeyID?: string,
  pubKey?: hexValue,
  sig?: string,
  ttl?: number,
  topic: hexValue,
  payload: hexValue,
  padding?: hexValue,
  powTime?: number,
  powTarget?: number,
  targetPeer?: string,
}

export type ShhReceivedMessage = {
  sig?: hexValue,
  ttl: number,
  timestamp: number,
  topic: hexValue,
  payload: hexValue,
  padding: hexValue,
  pow: number,
  hash: number,
  recipientPublicKey?: hexValue,
}
