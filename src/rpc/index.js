// @flow

import http from './http'
import ipc from './ipc'
import webSocket from './webSocket'
import type RPC from './BaseRPC'

const HTTP_RE = /^https?:\/\//gi
const WS_RE = /^wss?:\/\//gi

export { default as RequestRPC } from './Request'
export { default as StreamRPC } from './Stream'

export const httpRPC = http
export const ipcRPC = ipc
export const webSocketRPC = webSocket

export default (endpoint: string): RPC => {
  if (HTTP_RE.test(endpoint)) {
    return http(endpoint)
  }
  if (WS_RE.test(endpoint)) {
    return webSocket(endpoint)
  }
  return ipc(endpoint)
}
