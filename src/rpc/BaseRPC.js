// @flow

export default class BaseRPC {
  _canSubscribe: boolean

  constructor(canSubscribe?: boolean = false) {
    this._canSubscribe = canSubscribe
  }

  get canSubscribe(): boolean {
    return this._canSubscribe
  }

  request(...args: *): Promise<any> {
    return Promise.reject(new Error('Must be implemented'))
  }
}
