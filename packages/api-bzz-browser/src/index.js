// @flow
/* eslint-env browser */

import BaseBzz from '@erebos/api-bzz-base'

export type * from '@erebos/api-bzz-base'

export default class Bzz extends BaseBzz {
  constructor(url: string) {
    super(url)
    this._fetch = window.fetch.bind(window)
    this._FormData = window.FormData.bind(window)
  }

  uploadDirectory(_directory: Object): Promise<string> {
    return Promise.reject(new Error('Not Implemented'))
  }
}
