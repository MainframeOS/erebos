// @flow
/* eslint-env browser */

import BaseBzz from 'erebos-api-bzz-base'

export default class Bzz extends BaseBzz {
  constructor(url: string) {
    super(url)
    this._fetch = window.fetch
  }

  downloadRawBlob(hash: string): Promise<Blob> {
    return this.downloadRaw(hash).then(res => res.blob())
  }
}
