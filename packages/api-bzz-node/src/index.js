// @flow

import path from 'path'
import type { Readable } from 'stream'
import BaseBzz, {
  type DirectoryData,
  type FileEntry,
  type DownloadOptions,
  type UploadOptions,
} from '@erebos/api-bzz-base'
import FormData from 'form-data'
import { createReadStream, createWriteStream, ensureDir, lstat } from 'fs-extra'
import fetch from 'node-fetch'
import tarFs from 'tar-fs'
import tarStream from 'tar-stream'
import { Observable } from 'rxjs'

export type * from '@erebos/api-bzz-base'

export const writeStreamTo = async (
  stream: Readable,
  filePath: string,
): Promise<void> => {
  await ensureDir(path.dirname(filePath))
  await new Promise((resolve, reject) => {
    stream
      .pipe(createWriteStream(filePath))
      .on('error', err => {
        reject(err)
      })
      .on('finish', () => {
        resolve()
      })
  })
}

export const extractTarStreamTo = async (
  stream: Readable,
  dirPath: string,
): Promise<number> => {
  await ensureDir(dirPath)
  return await new Promise((resolve, reject) => {
    const extract = tarStream.extract()
    const writeFiles = [] // Keep track of files to write
    extract.on('entry', (header, stream, next) => {
      if (header.type === 'file' && header.name.length > 0) {
        const filePath = path.join(dirPath, header.name)
        const fileWritten = writeStreamTo(stream, filePath).then(() => {
          next() // Extract next entry after file has been written
        })
        writeFiles.push(fileWritten)
      } else {
        next()
      }
    })
    extract.on('error', err => {
      reject(err)
    })
    extract.on('finish', async () => {
      // Wait until all files have been written before resolving
      try {
        await Promise.all(writeFiles)
        resolve(writeFiles.length)
      } catch (err) {
        reject(err)
      }
    })
    stream.pipe(extract)
  })
}

export const packTarWithDefault = (
  tarPath: string,
  defaultPath: string,
): Readable => {
  let defaultFileStream
  const pack = tarFs.pack(tarPath, {
    finalize: false,
    finish: () => {
      if (defaultFileStream == null) {
        pack.finalize()
      } else {
        const defaultEntry = pack.entry({ name: '' }, () => {
          pack.finalize()
        })
        defaultFileStream.pipe(defaultEntry)
      }
    },
    mapStream: (fileStream, header) => {
      if (header.name === defaultPath) {
        defaultFileStream = fileStream
      }
      return fileStream
    },
  })
  return pack
}

export const packTar = (
  path: string,
  options?: UploadOptions = {},
): Readable => {
  return options.defaultPath
    ? packTarWithDefault(path, options.defaultPath)
    : tarFs.pack(path)
}

const isFile = async (path: string): Promise<boolean> => {
  const stat = await lstat(path)
  return stat.isFile()
}

export default class Bzz extends BaseBzz {
  constructor(url: string) {
    super(url)
    this._fetch = fetch
    this._FormData = FormData
  }

  async uploadDirectory(
    directory: DirectoryData,
    options?: UploadOptions = {},
  ): Promise<string> {
    const form = new this._FormData()
    Object.keys(directory).forEach(key => {
      form.append(key, directory[key].data, {
        contentType: directory[key].contentType,
      })
    })
    if (options.defaultPath != null) {
      const file = directory[options.defaultPath]
      if (file == null) {
        throw new Error('Default path file not found')
      }
      form.append('', file.data, { contentType: file.contentType })
    }
    return await this._upload(form, options, form.getHeaders())
  }

  async _uploadTarStream(
    stream: Readable,
    options?: UploadOptions = {},
  ): Promise<string> {
    return await this._upload(stream, options, {
      'content-type': 'application/x-tar',
    })
  }

  // path must be either a tar archive or a directory
  async uploadTar(path: string, options?: UploadOptions = {}): Promise<string> {
    const stream = (await isFile(path))
      ? createReadStream(path)
      : packTar(path, options)
    return await this._uploadTarStream(stream, options)
  }

  async uploadDirectoryFrom(
    path: string,
    options?: UploadOptions = {},
  ): Promise<string> {
    return await this._uploadTarStream(packTar(path, options), options)
  }

  async uploadFileFrom(
    path: string,
    options?: UploadOptions = {},
  ): Promise<string> {
    const raw = options.contentType == null
    const headers = raw ? {} : { 'content-type': options.contentType }
    return await this._upload(createReadStream(path), options, headers, raw)
  }

  async uploadFrom(
    path: string,
    options?: UploadOptions = {},
  ): Promise<string> {
    if (await isFile(path)) {
      return await this.uploadFileFrom(path, options)
    } else {
      return await this.uploadDirectoryFrom(path, options)
    }
  }

  async _downloadTar(hash: string, options: DownloadOptions): Promise<*> {
    return await this._download(hash, options, { accept: 'application/x-tar' })
  }

  downloadObservable(
    hash: string,
    options?: DownloadOptions = {},
  ): Observable<FileEntry> {
    return Observable.create(async observer => {
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

  async downloadDirectoryTo(
    hash: string,
    toPath: string,
    options?: DownloadOptions = {},
  ): Promise<number> {
    const res = await this._downloadTar(hash, options)
    return await extractTarStreamTo(res.body, toPath)
  }

  async downloadFileTo(
    hash: string,
    toPath: string,
    options?: DownloadOptions = {},
  ): Promise<void> {
    const res = await this._download(hash, options)
    await writeStreamTo(res.body, toPath)
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
}
