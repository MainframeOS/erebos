// @flow

export default class BaseBzz {
  _fetch: *
  _url: string

  constructor(url: string) {
    this._url = url
  }

  uploadRaw(data: string | Buffer, headers?: Object = {}): Promise<string> {
    const body = typeof data === 'string' ? Buffer.from(data) : data
    headers['content-length'] = body.length
    return this._fetch(`${this._url}/bzz-raw:`, {
      body,
      headers,
      method: 'POST',
    }).then(res => res.text())
  }

  downloadRaw(hash: string): Promise<*> {
    return this._fetch(`${this._url}/bzz-raw:/${hash}`)
  }

  downloadRawText(hash: string): Promise<string> {
    return this.downloadRaw(hash).then(res => res.text())
  }
}
