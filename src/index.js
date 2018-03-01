// @flow

import { default as ErebosClient } from './Client'
import type { ClientConfig } from './types'

export { BzzAPI, EthAPI, NetAPI, PssAPI, ShhAPI, Web3API } from './api'
export {
  default as rpc,
  httpRPC,
  ipcRPC,
  webSocketRPC,
  RequestRPC,
  StreamRPC,
} from './rpc'
export { httpTransport, ipcTransport, webSocketTransport } from './transport'
export { encodeHex, decodeHex } from './utils'
export * from './types'

export const Client = ErebosClient

export const erebos = (config: string | ClientConfig) =>
  new ErebosClient(config)
