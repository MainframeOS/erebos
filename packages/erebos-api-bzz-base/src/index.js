// @flow

export default class BaseBzz {
  _fetch: *
  _url: string

  constructor(url: string) {
    this._url = url
  }

  upload(data: string | Buffer, headers?: Object = {}): Promise<string> {
    const body = typeof data === 'string' ? Buffer.from(data) : data
    headers['content-length'] = body.length
    return this._fetch(`${this._url}/bzz:`, {
      body,
      headers,
      method: 'POST',
    }).then(res => res.ok ? res.text() : Promise.reject(new Error(res.statusText)))
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

  download(hash: string, path?: string = ''): Promise<*> {
    const content_path = path === '' ? '' : `/${path}`
    return this._fetch(`${this._url}/bzz:/${hash}${content_path}`)
  }

  downloadText(hash: string, path?: string = ''): Promise<string> {
    return this.download(hash, path).then(res => res.text())
  }

  downloadRaw(hash: string): Promise<*> {
    return this._fetch(`${this._url}/bzz-raw:/${hash}`)
  }

  downloadRawText(hash: string): Promise<string> {
    return this.downloadRaw(hash).then(res => res.text())
  }
}
