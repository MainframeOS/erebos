// @flow

import BaseBzz from 'erebos-api-bzz-base'
import fetch from 'node-fetch'

export default class Bzz extends BaseBzz {
  constructor(url: string) {
    super(url)
    this._fetch = fetch
  }

  downloadBuffer(hash: string): Promise<Buffer> {
    return this.download(hash).then(res => res.buffer())
  }

  downloadRawBuffer(hash: string): Promise<Buffer> {
    return this.downloadRaw(hash).then(res => res.buffer())
  }
}
