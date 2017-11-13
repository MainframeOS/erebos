// @flow

import { WebSocketSubject } from 'rxjs/observable/dom/WebSocketSubject'

import PSS from './PSS'
import RPC from './RPC'

export default (url: string) => {
  const ws = new WebSocketSubject(url)
  const rpc = new RPC(ws)
  return new PSS(rpc)
}
