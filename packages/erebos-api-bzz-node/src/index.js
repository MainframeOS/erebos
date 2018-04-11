// @flow

import BaseBzz from 'erebos-api-bzz-base'
import fetch from 'node-fetch'

export default class Bzz extends BaseBzz {
  constructor(url: string) {
    super(url)
    this._fetch = fetch
  }

  downloadRawBuffer(hash: string): Promise<Buffer> {
    return this.downloadRaw(hash).then(res => res.buffer())
  }
}
