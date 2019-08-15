import { WebSocketSubject } from 'rxjs/webSocket'

export function createTransport<T = any>(url: string): WebSocketSubject<T> {
  return new WebSocketSubject<T>({ url })
}
