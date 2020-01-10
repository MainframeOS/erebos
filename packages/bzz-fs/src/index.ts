import { createReadStream } from 'fs'
import { resolve as resolvePath } from 'path'
import { BzzNode, DownloadOptions, UploadOptions } from '@erebos/bzz-node'
import tarFS from 'tar-fs'

import { getSize, isFile, writeStreamTo, extractTarStreamTo } from './fs'
export * from './fs'

export interface BzzFSConfig {
  basePath?: string
  bzz: BzzNode
}

export class BzzFS {
  public readonly basePath: string | void
  public readonly bzz: BzzNode

  public constructor(config: BzzFSConfig) {
    this.basePath = config.basePath
    this.bzz = config.bzz
  }

  protected resolvePath(path: string): string {
    return this.basePath == null ? path : resolvePath(this.basePath, path)
  }

  public async downloadTarTo(
    hash: string,
    toPath: string,
    options: DownloadOptions = {},
  ): Promise<void> {
    const res = await this.bzz.downloadTar(hash, options)
    await writeStreamTo(res.body, this.resolvePath(toPath))
  }

  public async downloadFileTo(
    hash: string,
    toPath: string,
    options: DownloadOptions = {},
  ): Promise<void> {
    const res = await this.bzz.download(hash, options)
    await writeStreamTo(res.body, this.resolvePath(toPath))
  }

  public async downloadDirectoryTo(
    hash: string,
    toPath: string,
    options: DownloadOptions = {},
  ): Promise<number> {
    const res = await this.bzz.downloadTar(hash, options)
    return await extractTarStreamTo(res.body, this.resolvePath(toPath))
  }

  public async downloadTo(
    hash: string,
    toPath: string,
    options: DownloadOptions = {},
  ): Promise<void> {
    const path = this.resolvePath(toPath)
    if (await isFile(path)) {
      await this.downloadFileTo(hash, path, options)
    } else {
      await this.downloadDirectoryTo(hash, path, options)
    }
  }

  public async uploadFileFrom(
    fromPath: string,
    options: UploadOptions = {},
  ): Promise<string> {
    const path = this.resolvePath(fromPath)
    const size = options.size == null ? await getSize(path) : options.size
    return await this.bzz.uploadFile(createReadStream(path), {
      ...options,
      size,
    })
  }

  private async uploadTarStream(
    stream: NodeJS.ReadableStream,
    options: UploadOptions = {},
  ): Promise<string> {
    return await this.bzz.uploadFile(stream, {
      ...options,
      contentType: 'application/x-tar',
    })
  }

  // path must be either a tar archive or a directory
  public async uploadTar(
    fromPath: string,
    options: UploadOptions = {},
  ): Promise<string> {
    const path = this.resolvePath(fromPath)
    const stream = (await isFile(path))
      ? createReadStream(path)
      : tarFS.pack(path)
    return await this.uploadTarStream(stream, options)
  }

  public async uploadDirectoryFrom(
    fromPath: string,
    options: UploadOptions = {},
  ): Promise<string> {
    const path = this.resolvePath(fromPath)
    return await this.uploadTarStream(tarFS.pack(path), options)
  }

  public async uploadFrom(
    fromPath: string,
    options: UploadOptions = {},
  ): Promise<string> {
    const path = this.resolvePath(fromPath)
    return (await isFile(path))
      ? await this.uploadFileFrom(path, options)
      : await this.uploadDirectoryFrom(path, options)
  }
}
