// @flow
/* eslint-env browser */

import BaseBzz from 'erebos-api-bzz-base'

export default class Bzz extends BaseBzz {
  constructor(url: string) {
    super(url)
    this._fetch = window.fetch
    this._FormData = window.FormData
  }

  // eslint-disable-next-line no-unused-vars
  uploadDirectory(directory: Object): Promise<string> {
    return Promise.reject(new Error('Not Implemented'))
  }

  downloadRawBlob(hash: string): Promise<Blob> {
    return this.downloadRaw(hash).then(res => res.blob())
  }
}
