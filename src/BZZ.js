// @flow

import fetch from 'node-fetch'

import BaseBZZ from './BaseBZZ'

export default class BZZ extends BaseBZZ {
  constructor(url: string) {
    super(url)
    this._fetch = fetch
  }

  downloadRawBuffer(hash: string): Promise<Buffer> {
    return this.downloadRaw(hash).then(res => res.buffer())
  }
}
