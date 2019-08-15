import { Config, SocketSubject } from 'rx-socket'

export type PathOrConfig = string | Config

export function createTransport<T = any>(
  pathOrConfig: PathOrConfig,
): SocketSubject<T> {
  return new SocketSubject<T>(pathOrConfig)
}
