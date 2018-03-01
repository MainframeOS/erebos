// @flow

import StreamRPC from './Stream'
import ipcTransport from '../transport/ipc'

export default (path: string) => new StreamRPC(ipcTransport(path))
