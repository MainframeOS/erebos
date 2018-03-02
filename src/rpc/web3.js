// @flow

import RequestRPC from './Request'
import web3Transport from '../transport/web3'

export default (provider?: ?Object) => new RequestRPC(web3Transport(provider))
