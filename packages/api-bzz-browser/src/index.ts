/* eslint-env browser */

import {
  BaseBzz,
  BzzConfig,
  DirectoryData,
  UploadOptions,
} from '@erebos/api-bzz-base'
import { hexValue } from '@erebos/hex'

export * from '@erebos/api-bzz-base'

export class Bzz extends BaseBzz<Response> {
  public constructor(config: BzzConfig) {
    const { url, ...cfg } = config
    super(window.fetch.bind(window), { ...cfg, url: new URL(url).href })
  }

  public uploadDirectory(
    directory: DirectoryData,
    options: UploadOptions = {},
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
    return this.uploadBody(form, options)
  }
}
