/* eslint-env browser */
import { URL } from 'universal-url'
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
        ({
          uri: directory[key].data,
          type: directory[key].contentType,
          name: key,
        } as any),
        key,
      )
    })
    if (options.defaultPath != null) {
      const file = directory[options.defaultPath]
      if (file != null) {
        form.append(
          '',
          ({
            uri: directory[options.defaultPath].data,
            type: directory[options.defaultPath].contentType,
            name: options.defaultPath,
          } as any),
          '',
        )
      }
    }
    return this.uploadBody(form, options)
  }
}
