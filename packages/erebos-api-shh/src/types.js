// @flow

import type { default as RPCType } from '@mainframe/rpc-base'
import type { hex as hexType } from '@mainframe/utils-hex'

export type RPC = RPCType
export type hex = hexType

export type ShhInfo = {
  memory: number,
  messages: number,
  minPow: number,
  maxMessageSize: number,
}

export type ShhFilterCriteria = {
  symKeyID?: string,
  privateKeyID?: string,
  sig?: hex,
  minPow?: number,
  topics: Array<hex>,
  allowP2P?: boolean,
}

export type ShhPostMessage = {
  symKeyID?: string,
  pubKey?: hex,
  sig?: string,
  ttl?: number,
  topic: hex,
  payload: hex,
  padding?: hex,
  powTime?: number,
  powTarget?: number,
  targetPeer?: string,
}

export type ShhReceivedMessage = {
  sig?: hex,
  ttl: number,
  timestamp: number,
  topic: hex,
  payload: hex,
  padding: hex,
  pow: number,
  hash: number,
  recipientPublicKey?: hex,
}
