import { Readable } from 'stream'
import { createReadStream } from 'fs'
import { URL } from 'url'
import {
  BaseBzz,
  BzzConfig,
  DirectoryData,
  DownloadOptions,
  UploadOptions,
} from '@erebos/api-bzz-base'
import { hexValue } from '@erebos/hex'
import FormData from 'form-data'
import fetch, { Response } from 'node-fetch'
import tarFS from 'tar-fs'

import { getSize, isFile, writeStreamTo, extractTarStreamTo } from './fs'

export * from '@erebos/api-bzz-base'

export class Bzz extends BaseBzz<Response, Readable> {
  public constructor(config: BzzConfig) {
    const { url, ...cfg } = config
    super(fetch, {
      ...cfg,
      url: new URL(url).href,
    })
  }

  protected normalizeStream(stream: NodeJS.ReadableStream): Readable {
    return stream as Readable
  }

  public async downloadTarTo(
    hash: string,
    toPath: string,
    options: DownloadOptions = {},
  ): Promise<void> {
    const res = await this.downloadTar(hash, options)
    await writeStreamTo(this.normalizeStream(res.body), toPath)
  }

  public async downloadFileTo(
    hash: string,
    toPath: string,
    options: DownloadOptions = {},
  ): Promise<void> {
    const res = await this.download(hash, options)
    await writeStreamTo(this.normalizeStream(res.body), toPath)
  }

  public async downloadDirectoryTo(
    hash: string,
    toPath: string,
    options: DownloadOptions = {},
  ): Promise<number> {
    const res = await this.downloadTar(hash, options)
    return await extractTarStreamTo(this.normalizeStream(res.body), toPath)
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
    if (options.pin) {
      headers['x-swarm-pin'] = true
    }
    options.headers = { ...headers, ...form.getHeaders() }

    return await this.uploadBody(form, options)
  }

  public async uploadFileFrom(
    path: string,
    options: UploadOptions = {},
  ): Promise<hexValue> {
    const size = options.size == null ? await getSize(path) : options.size
    return await this.uploadFile(createReadStream(path), {
      ...options,
      size,
    })
  }

  private async uploadTarStream(
    stream: Readable,
    options: UploadOptions = {},
  ): Promise<hexValue> {
    if (options.headers == null) {
      options.headers = {}
    }
    options.headers['content-type'] = 'application/x-tar'

    if (options.pin) {
      options.headers['x-swarm-pin'] = true
    }

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
    return await this.uploadTarStream((stream as unknown) as Readable, options)
  }

  public async uploadDirectoryFrom(
    path: string,
    options: UploadOptions = {},
  ): Promise<hexValue> {
    return await this.uploadTarStream(
      (tarFS.pack(path) as unknown) as Readable,
      options,
    )
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
