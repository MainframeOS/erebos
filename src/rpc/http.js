// @flow

import RequestRPC from './Request'
import httpTransport from '../transport/http'

export default (url: string) => new RequestRPC(httpTransport(url))
