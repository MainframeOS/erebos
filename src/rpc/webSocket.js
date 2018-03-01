// @flow

import StreamRPC from './Stream'
import webSocketTransport from '../transport/webSocket'

export default (url: string) => new StreamRPC(webSocketTransport(url))
