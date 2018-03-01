// @flow

export default class BaseRPC {
  _canSubscribe: boolean

  constructor(canSubscribe?: boolean = false) {
    this._canSubscribe = canSubscribe
  }

  get canSubscribe(): boolean {
    return this._canSubscribe
  }

  async request(...args: *) {
    throw new Error('Must be implemented')
  }
}
