// @flow

import BaseBZZ from './BaseBZZ'

export default class BZZ extends BaseBZZ {
  constructor(url: string) {
    super(url)
    this._fetch = window.fetch
  }

  downloadRawBlob(hash: string): Promise<Blob> {
    return this.downloadRaw(hash).then(res => res.blob())
  }
}
