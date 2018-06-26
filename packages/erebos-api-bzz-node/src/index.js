// @flow

import BaseBzz from 'erebos-api-bzz-base'
import FormData from 'form-data'
import fetch from 'node-fetch'

export default class Bzz extends BaseBzz {
  constructor(url: string) {
    super(url)
    this._fetch = fetch
    this._FormData = FormData
  }

  downloadBuffer(hash: string, path?: string = ''): Promise<Buffer> {
    return this.download(hash, path).then(res => res.buffer())
  }

  downloadRawBuffer(hash: string): Promise<Buffer> {
    return this.downloadRaw(hash).then(res => res.buffer())
  }
}
