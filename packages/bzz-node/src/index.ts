import {
  Bzz,
  BzzConfig,
  DirectoryData,
  DownloadOptions,
  UploadOptions,
} from '@erebos/bzz'
import FormData from 'form-data'
import nodeFetch, { Response } from 'node-fetch'
import tarStream from 'tar-stream'

export * from '@erebos/bzz'

export class BzzNode extends Bzz<NodeJS.ReadableStream, Response, FormData> {
  public constructor(config: BzzConfig<Response>) {
    const fetch = config.fetch || nodeFetch
    super({ ...config, fetch })
  }

  public async downloadDirectory(
    hash: string,
    options: DownloadOptions = {},
  ): Promise<DirectoryData> {
    const directoryData: DirectoryData = {}
    const extract = tarStream.extract()
    extract.on('entry', (header, stream, next) => {
      if (header.type === 'file') {
        const chunks: Array<Buffer> = []
        stream.on('data', (chunk: Buffer) => {
          chunks.push(chunk)
        })
        stream.on('end', () => {
          directoryData[header.name] = {
            data: Buffer.concat(chunks),
            size: header.size,
          }
          next()
        })
        stream.resume()
      } else {
        next()
      }
    })

    const res = await this.downloadTar(hash, options)
    return await new Promise(resolve => {
      extract.on('finish', () => {
        resolve(directoryData)
      })
      res.body.pipe(extract)
    })
  }

  public async uploadDirectory(
    directory: DirectoryData,
    options: UploadOptions = {},
  ): Promise<string> {
    const form = new FormData()
    Object.keys(directory).forEach(key => {
      form.append(key, directory[key].data, {
        contentType: directory[key].contentType,
      })
    })

    if (options.defaultPath != null) {
      const file = directory[options.defaultPath]
      if (file != null) {
        form.append('', file.data, { contentType: file.contentType })
      }
    }

    const headers = options.headers || {}
    if (options.pin) {
      headers['x-swarm-pin'] = true
    }
    options.headers = { ...headers, ...form.getHeaders() }

    return await this.uploadBody(form, options)
  }
}
