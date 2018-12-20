// @flow

import { createReadStream } from 'fs'
import type { Readable } from 'stream'
import BaseBzz, {
  type BzzConfig,
  type DirectoryData,
  type FileEntry,
  type DownloadOptions,
  type UploadOptions,
} from '@erebos/api-bzz-base'
import type { hexValue } from '@erebos/hex'
import FormData from 'form-data'
import fetch from 'node-fetch'
import { Observable } from 'rxjs'
import tarFS from 'tar-fs'
import tarStream from 'tar-stream'

import { isFile, writeStreamTo, extractTarStreamTo } from './fs'

export type * from '@erebos/api-bzz-base'

export default class Bzz extends BaseBzz {
  constructor(config: BzzConfig) {
    const { url, ...cfg } = config
    super({ ...cfg, url: new URL(url).href })
    this._fetch = fetch
  }

  async _downloadTar(hash: string, options: DownloadOptions): Promise<*> {
    if (options.headers == null) {
      options.headers = {}
    }
    options.headers.accept = 'application/x-tar'
    return await this._download(hash, options)
  }

  downloadObservable(
    hash: string,
    options?: DownloadOptions = {},
  ): Observable<FileEntry> {
    return Observable.create(observer => {
      this._downloadTar(hash, options).then(
        res => {
          const extract = tarStream.extract()
          extract.on('entry', (header, stream, next) => {
            if (header.type === 'file') {
              const chunks = []
              stream.on('data', chunk => {
                chunks.push(chunk)
              })
              stream.on('end', () => {
                observer.next({
                  data: Buffer.concat(chunks),
                  path: header.name,
                  size: header.size,
                })
                next()
              })
              stream.resume()
            } else {
              next()
            }
          })
          extract.on('finish', () => {
            observer.complete()
          })
          res.body.pipe(extract)
        },
        err => {
          observer.error(err)
        },
      )
    })
  }

  downloadDirectoryData(
    hash: string,
    options?: DownloadOptions = {},
  ): Promise<DirectoryData> {
    return new Promise((resolve, reject) => {
      const directoryData = {}
      this.downloadObservable(hash, options).subscribe({
        next: entry => {
          directoryData[entry.path] = { data: entry.data, size: entry.size }
        },
        error: err => {
          reject(err)
        },
        complete: () => {
          resolve(directoryData)
        },
      })
    })
  }

  async downloadFileTo(
    hash: string,
    toPath: string,
    options?: DownloadOptions = {},
  ): Promise<void> {
    const res = await this._download(hash, options)
    await writeStreamTo(res.body, toPath)
  }

  async downloadDirectoryTo(
    hash: string,
    toPath: string,
    options?: DownloadOptions = {},
  ): Promise<number> {
    const res = await this._downloadTar(hash, options)
    return await extractTarStreamTo(res.body, toPath)
  }

  async downloadTo(
    hash: string,
    toPath: string,
    options?: DownloadOptions = {},
  ): Promise<void> {
    if (await isFile(toPath)) {
      await this.downloadFileTo(hash, toPath, options)
    } else {
      await this.downloadDirectoryTo(hash, toPath, options)
    }
  }

  async uploadDirectory(
    directory: DirectoryData,
    options?: UploadOptions = {},
  ): Promise<hexValue> {
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
    options.headers = { ...headers, ...form.getHeaders() }
    return await this._upload(form, options)
  }

  async uploadFileStream(
    stream: Readable,
    options?: UploadOptions = {},
  ): Promise<hexValue> {
    const raw = options.contentType == null
    if (!raw) {
      if (options.headers == null) {
        options.headers = {}
      }
      options.headers['content-type'] = options.contentType
    }
    return await this._upload(stream, options, raw)
  }

  async uploadFileFrom(
    path: string,
    options?: UploadOptions,
  ): Promise<hexValue> {
    return await this.uploadFileStream(createReadStream(path), options)
  }

  async _uploadTarStream(
    stream: Readable,
    options?: UploadOptions = {},
  ): Promise<hexValue> {
    if (options.headers == null) {
      options.headers = {}
    }
    options.headers['content-type'] = 'application/x-tar'
    return await this._upload(stream, options)
  }

  // path must be either a tar archive or a directory
  async uploadTar(
    path: string,
    options?: UploadOptions = {},
  ): Promise<hexValue> {
    const stream = (await isFile(path))
      ? createReadStream(path)
      : tarFS.pack(path)
    return await this._uploadTarStream(stream, options)
  }

  async uploadDirectoryFrom(
    path: string,
    options?: UploadOptions = {},
  ): Promise<hexValue> {
    return await this._uploadTarStream(tarFS.pack(path), options)
  }

  async uploadFrom(
    path: string,
    options?: UploadOptions = {},
  ): Promise<hexValue> {
    if (await isFile(path)) {
      return await this.uploadFileFrom(path, options)
    } else {
      return await this.uploadDirectoryFrom(path, options)
    }
  }
}
