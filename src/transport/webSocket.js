// @flow

import { WebSocketSubject } from 'rxjs/observable/dom/WebSocketSubject'
import WebSocket from 'ws'

export default (url: string) =>
  new WebSocketSubject({ url, WebSocketCtor: WebSocket })
