// @flow
/* eslint-env browser */

import BaseBzz, {
  type DirectoryData, // eslint-disable-line import/named
} from '@erebos/api-bzz-base'

export type * from '@erebos/api-bzz-base'

export default class Bzz extends BaseBzz {
  constructor(url: string) {
    super(url)
    this._fetch = window.fetch.bind(window)
    this._FormData = window.FormData.bind(window)
  }

  uploadDirectory(directory: DirectoryData): Promise<string> {
    const form = new this._FormData()
    Object.keys(directory).forEach(function(key) {
      form.append(
        key,
        new Blob([directory[key].data], { type: directory[key].contentType }),
        key,
      )
    })
    return this._fetch(`${this._url}bzz:/`, {
      method: 'POST',
      body: form,
    }).then(
      res => (res.ok ? res.text() : Promise.reject(new Error(res.statusText))),
    )
  }
}
