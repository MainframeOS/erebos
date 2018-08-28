// @flow

export type DirectoryData = {
  [path: string]: { data: string | Buffer, contentType: string, size?: number },
}

export type FileEntry = {
  data: string | Buffer,
  path: string,
  size?: number,
}

export default class BaseBzz {
  _fetch: *
  _FormData: *
  _url: string

  constructor(url: string) {
    this._url = new URL(url).toString()
  }

  upload(
    data: string | Buffer | DirectoryData,
    headers?: Object = {},
  ): Promise<string> {
    if (typeof data === 'string' || Buffer.isBuffer(data)) {
      // $FlowFixMe: Flow doesn't understand type refinement with Buffer check
      return this.uploadFile(data, headers)
    } else {
      return this.uploadDirectory(data)
    }
  }

  uploadDirectory(_directory: Object): Promise<string> {
    return Promise.reject(new Error('Must be implemented in extending class'))
  }

  downloadDirectory(_hash: string): Promise<string> {
    return Promise.reject(new Error('Must be implemented in extending class'))
  }

  uploadFile(data: string | Buffer, headers?: Object = {}): Promise<string> {
    const body = typeof data === 'string' ? Buffer.from(data) : data
    headers['content-length'] = body.length
    return this._fetch(`${this._url}bzz:/`, {
      body: body,
      headers: headers,
      method: 'POST',
    }).then(
      res => (res.ok ? res.text() : Promise.reject(new Error(res.statusText))),
    )
  }

  uploadRaw(data: string | Buffer, headers?: Object = {}): Promise<string> {
    const body = typeof data === 'string' ? Buffer.from(data) : data
    headers['content-length'] = body.length
    return this._fetch(`${this._url}bzz-raw:/`, {
      body: body,
      headers: headers,
      method: 'POST',
    }).then(res => res.text())
  }

  download(hash: string, path?: string = ''): Promise<*> {
    const contentPath = path === '' ? '' : `/${path}`
    return this._fetch(`${this._url}bzz:/${hash}${contentPath}`)
  }

  downloadText(hash: string, path?: string = ''): Promise<string> {
    return this.download(hash, path).then(res => res.text())
  }

  downloadRaw(hash: string): Promise<*> {
    return this._fetch(`${this._url}bzz-raw:/${hash}`)
  }

  downloadRawText(hash: string): Promise<string> {
    return this.downloadRaw(hash).then(res => res.text())
  }

  listDirectory(hash: string): Promise<string> {
    return this._fetch(`${this._url}bzz-list:/${hash}`).then(
      res => (res.ok ? res.text() : Promise.reject(new Error(res.statusText))),
    )
  }

  getHash(url: string): Promise<string> {
    return this._fetch(`${this._url}bzz-hash:/${url}`).then(
      res => (res.ok ? res.text() : Promise.reject(new Error(res.statusText))),
    )
  }
}
