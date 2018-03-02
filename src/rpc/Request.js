// @flow

import BaseRPC from './BaseRPC'

export default class RequestRPC extends BaseRPC {
  _currentId: number = 1
  _fetch: (data: Object) => Promise<Object>

  constructor(fetch: *) {
    super(false)
    this._fetch = fetch
  }

  request(method: string, params?: Array<any>): Promise<any> {
    return this._fetch({
      id: this._currentId++,
      jsonrpc: '2.0',
      method,
      params,
    }).then(msg => {
      if (msg.error) {
        const err: Object = new Error(msg.error.message)
        err.code = msg.error.code
        throw err
      }
      return msg.result
    })
  }
}
