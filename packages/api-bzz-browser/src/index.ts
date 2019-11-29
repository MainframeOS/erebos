/* eslint-env browser */

import {
  BaseBzz,
  BzzConfig,
  DirectoryData,
  UploadOptions,
} from '@erebos/api-bzz-base'
import { hexValue } from '@erebos/hex'
import { Readable } from 'readable-stream'
import { NodeReadable } from './utils'

export * from '@erebos/api-bzz-base'

export class Bzz extends BaseBzz<Response, Readable> {
  public constructor(config: BzzConfig) {
    const { url, ...cfg } = config
    const fetch =
      typeof window !== 'undefined'
        ? window.fetch.bind(window)
        : self.fetch.bind(self)

    super(fetch, { ...cfg, url: new URL(url).href })
  }

  protected normalizeStream(stream: ReadableStream): Readable {
    return (new NodeReadable(stream) as unknown) as Readable
  }

  protected async uploadBody(
    body: Buffer | FormData | Readable,
    options: UploadOptions,
    raw = false,
  ): Promise<hexValue> {
    if (Buffer.isBuffer(body) || body instanceof FormData) {
      return super.uploadBody(body, options, raw)
    }

    return new Promise(resolve => {
      const buffers: Array<Uint8Array> = []

      body.on('data', function(d) {
        buffers.push(d)
      })

      body.on('end', function() {
        // @ts-ignore
        resolve(Buffer.concat(buffers))
      })
    }).then(data => super.uploadBody(data as Buffer, options, raw))
  }

  public async uploadDirectory(
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

    if (options.pin) {
      if (options.headers == null) {
        options.headers = {}
      }
      options.headers['x-swarm-pin'] = true
    }

    return await this.uploadBody(form, options)
  }
}
