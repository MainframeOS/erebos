// @flow
/* eslint-env browser */

import BaseBzz, {
  type DirectoryData,
  type UploadOptions,
} from '@erebos/api-bzz-base'
import type { hexValue } from '@erebos/hex'

export type * from '@erebos/api-bzz-base'

export default class Bzz extends BaseBzz {
  constructor(url: string) {
    super(url)
    this._fetch = window.fetch.bind(window)
  }

  uploadDirectory(
    directory: DirectoryData,
    options?: UploadOptions = {},
    headers?: Object = {},
  ): Promise<hexValue> {
    const form = new FormData()
    Object.keys(directory).forEach(key => {
      form.append(
        key,
        new Blob([directory[key].data], { type: directory[key].contentType }),
        key,
      )
    })
    if (options.defaultPath != null) {
      const file = directory[options.defaultPath]
      if (file != null) {
        form.append('', new Blob([file.data], { type: file.contentType }), '')
      }
    }
    return this._upload(form, options, headers)
  }
}
