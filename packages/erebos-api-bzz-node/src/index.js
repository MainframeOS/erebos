// @flow

import path from 'path'
import fs from 'fs'
import type { Readable } from 'stream'
import BaseBzz, {
  type DirectoryData, // eslint-disable-line import/named
  type FileEntry, // eslint-disable-line import/named
} from 'erebos-api-bzz-base'
import FormData from 'form-data'
import { createWriteStream, ensureDir } from 'fs-extra'
import fetch from 'node-fetch'
import tarFs from 'tar-fs'
import tarStream from 'tar-stream'
import { Observable } from 'rxjs'

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

export const extractTarStreamTo = (
  stream: Readable,
  dirPath: string,
): Promise<number> => {
  return new Promise((resolve, reject) => {
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
    extract.on('finish', () => {
      // Wait until all files have been written before resolving
      Promise.all(writeFiles).then(
        () => {
          resolve(writeFiles.length)
        },
        err => {
          reject(err)
        },
      )
    })
    ensureDir(dirPath).then(
      () => {
        stream.pipe(extract)
      },
      err => {
        reject(err)
      },
    )
  })
}

export default class Bzz extends BaseBzz {
  constructor(url: string) {
    super(url)
    this._fetch = fetch
    this._FormData = FormData
  }

  uploadDirectory(directory: DirectoryData): Promise<string> {
    const form = new this._FormData()
    Object.keys(directory).forEach(function(key) {
      form.append(key, directory[key].data)
    })

    return this._fetch(`${this._url}bzz:`, {
      method: 'POST',
      body: form,
      headers: form.getHeaders(),
    }).then(
      res => (res.ok ? res.text() : Promise.reject(new Error(res.statusText))),
    )
  }

  uploadTarData(directory: DirectoryData): Promise<string> {
    const pack = tarStream.pack()
    Object.keys(directory).forEach(function(key) {
      pack.entry({ name: key }, directory[key].data)
    })
    pack.finalize()

    return this._fetch(`${this._url}bzz:`, {
      method: 'POST',
      body: pack,
      headers: {
        'Content-Type': 'application/x-tar',
      },
    }).then(
      res => (res.ok ? res.text() : Promise.reject(new Error(res.statusText))),
    )
  }

  uploadTarFile(tarPath: string): Promise<string> {
    const readStream = fs.createReadStream(tarPath)

    return this._fetch(`${this._url}bzz:`, {
      method: 'POST',
      body: readStream,
      headers: {
        'Content-Type': 'application/x-tar',
      },
    }).then(
      res => (res.ok ? res.text() : Promise.reject(new Error(res.statusText))),
    )
  }

  downloadDirectoryTar(hash: string): Promise<*> {
    return this._fetch(`${this._url}bzz:/${hash}`, {
      headers: {
        Accept: 'application/x-tar',
      },
    }).then(res => (res.ok ? res : Promise.reject(new Error(res.statusText))))
  }

  downloadDirectoryObservable(hash: string): Observable<FileEntry> {
    return Observable.create(observer => {
      this.downloadDirectoryTar(hash).then(
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

  downloadDirectoryData(hash: string): Promise<DirectoryData> {
    return new Promise((resolve, reject) => {
      const directoryData = {}
      this.downloadDirectoryObservable(hash).subscribe({
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

  downloadDirectoryTo(hash: string, dirPath: string): Promise<number> {
    return this.downloadDirectoryTar(hash).then(res => {
      return extractTarStreamTo(res.body, dirPath)
    })
  }

  downloadBuffer(hash: string, path?: string = ''): Promise<Buffer> {
    return this.download(hash, path).then(res => res.buffer())
  }

  downloadRawBuffer(hash: string): Promise<Buffer> {
    return this.downloadRaw(hash).then(res => res.buffer())
  }
}
