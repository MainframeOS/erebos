import { WebSocketSubject } from 'rxjs/webSocket'
import WebSocket from 'ws'

export function createTransport<T = any>(url: string): WebSocketSubject<T> {
  // @ts-ignore: WebSocket constructor overload not detected
  return new WebSocketSubject<T>({ url, WebSocketCtor: WebSocket })
}
