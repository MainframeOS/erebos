import { createReadStream } from 'fs'
import { Readable } from 'stream'
import { URL } from 'url'
import {
  BaseBzz,
  BzzConfig,
  DirectoryData,
  FileEntry,
  DownloadOptions,
  UploadOptions,
} from '@erebos/api-bzz-base'
import { hexValue } from '@erebos/hex'
import FormData from 'form-data'
import fetch, { Response } from 'node-fetch'
import { Observable, Observer } from 'rxjs'
import tarFS from 'tar-fs'
import tarStream from 'tar-stream'

import { isFile, writeStreamTo, extractTarStreamTo } from './fs'

export * from '@erebos/api-bzz-base'

export class Bzz extends BaseBzz<Response> {
  public constructor(config: BzzConfig) {
    const { url, ...cfg } = config
    super(fetch, {
      ...cfg,
      url: new URL(url).href,
    })
  }

  private async downloadTar(
    hash: string,
    options: DownloadOptions,
  ): Promise<Response> {
    if (options.headers == null) {
      options.headers = {}
    }
    options.headers.accept = 'application/x-tar'
    return await this.download(hash, options)
  }

  public downloadObservable(
    hash: string,
    options: DownloadOptions = {},
  ): Observable<FileEntry> {
    return Observable.create((observer: Observer<FileEntry>) => {
      this.downloadTar(hash, options).then(
        res => {
          const extract = tarStream.extract()
          extract.on('entry', (header, stream, next) => {
            if (header.type === 'file') {
              const chunks: Array<Buffer> = []
              stream.on('data', (chunk: Buffer) => {
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
          // @ts-ignore
          res.body.pipe(extract)
        },
        err => {
          observer.error(err)
        },
      )
    })
  }

  public downloadDirectoryData(
    hash: string,
    options: DownloadOptions = {},
  ): Promise<DirectoryData> {
    return new Promise((resolve, reject) => {
      const directoryData: DirectoryData = {}
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

  public async downloadFileTo(
    hash: string,
    toPath: string,
    options: DownloadOptions = {},
  ): Promise<void> {
    const res = await this.download(hash, options)
    await writeStreamTo((res.body as unknown) as Readable, toPath)
  }

  public async downloadDirectoryTo(
    hash: string,
    toPath: string,
    options: DownloadOptions = {},
  ): Promise<number> {
    const res = await this.downloadTar(hash, options)
    return await extractTarStreamTo((res.body as unknown) as Readable, toPath)
  }

  public async downloadTo(
    hash: string,
    toPath: string,
    options: DownloadOptions = {},
  ): Promise<void> {
    if (await isFile(toPath)) {
      await this.downloadFileTo(hash, toPath, options)
    } else {
      await this.downloadDirectoryTo(hash, toPath, options)
    }
  }

  public async uploadDirectory(
    directory: DirectoryData,
    options: UploadOptions = {},
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
    return await this.uploadBody(form, options)
  }

  public async uploadFileStream(
    stream: Readable,
    options: UploadOptions = {},
  ): Promise<hexValue> {
    const raw = options.contentType == null
    if (!raw) {
      if (options.headers == null) {
        options.headers = {}
      }
      options.headers['content-type'] = options.contentType
    }
    return await this.uploadBody(stream, options, raw)
  }

  public async uploadFileFrom(
    path: string,
    options?: UploadOptions,
  ): Promise<hexValue> {
    return await this.uploadFileStream(createReadStream(path), options)
  }

  private async uploadTarStream(
    stream: Readable,
    options: UploadOptions = {},
  ): Promise<hexValue> {
    if (options.headers == null) {
      options.headers = {}
    }
    options.headers['content-type'] = 'application/x-tar'
    return await this.uploadBody(stream, options)
  }

  // path must be either a tar archive or a directory
  public async uploadTar(
    path: string,
    options: UploadOptions = {},
  ): Promise<hexValue> {
    const stream = (await isFile(path))
      ? createReadStream(path)
      : tarFS.pack(path)
    return await this.uploadTarStream(stream, options)
  }

  public async uploadDirectoryFrom(
    path: string,
    options: UploadOptions = {},
  ): Promise<hexValue> {
    return await this.uploadTarStream(tarFS.pack(path), options)
  }

  public async uploadFrom(
    path: string,
    options: UploadOptions = {},
  ): Promise<hexValue> {
    if (await isFile(path)) {
      return await this.uploadFileFrom(path, options)
    } else {
      return await this.uploadDirectoryFrom(path, options)
    }
  }
}
