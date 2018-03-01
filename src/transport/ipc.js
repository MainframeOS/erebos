// @flow

import { SocketSubject } from 'rx-socket'

export default (path: string) => new SocketSubject(path)
