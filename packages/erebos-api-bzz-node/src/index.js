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

  uploadDirectory(directory: Object) {
    const form = new this._FormData()
    Object.keys(directory).forEach(function(key) {
      form.append(key, directory[key].data)
    })

    return this._fetch(`${this._url}bzz:`, {
      method: 'POST',
      body: form,
      headers: form.getHeaders(),
    }).then(
      res => (res.ok ? res.text() : Promise.reject(new Error(res.statusText))),
    )
  }

  downloadDirectory(hash: string): Promise<*> {
    return this._fetch(`${this._url}bzz:/${hash}`, {
      method: 'GET',
      headers: {
        Accept: 'application/x-tar',
      },
    })
  }

  downloadBuffer(hash: string, path?: string = ''): Promise<Buffer> {
    return this.download(hash, path).then(res => res.buffer())
  }

  downloadRawBuffer(hash: string): Promise<Buffer> {
    return this.downloadRaw(hash).then(res => res.buffer())
  }
}
