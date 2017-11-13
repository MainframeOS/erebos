// @flow

import { WebSocketSubject } from 'rxjs/observable/dom/WebSocketSubject'
import WebSocket from 'ws'

import PSS from './PSS'
import RPC from './RPC'

export default (url: string) => {
  const ws = new WebSocketSubject({
    url,
    WebSocketCtor: WebSocket,
  })
  const rpc = new RPC(ws)
  return new PSS(rpc)
}
