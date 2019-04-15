// @flow

import type { Subscription } from 'rxjs'

import DocSubject from './DocSubject'
import type { DocSubscriberParams } from './types'

export default class DocSubscriber<T> extends DocSubject<T> {
  _pollInterval: number
  _subscription: ?Subscription

  constructor(params: DocSubscriberParams) {
    super(params)
    this._pollInterval = params.pollInterval
  }

  start() {
    if (this._subscription == null) {
      this._subscription = this._timeline
        .live({ interval: this._pollInterval })
        .subscribe(chapters => {
          this.applyUpdate(chapters)
        })
    }
  }

  stop() {
    if (this._subscription != null) {
      this._subscription.unsubscribe()
      this._subscription = undefined
    }
  }

  async init() {
    await this.pullChanges()
    this.start()
  }
}
