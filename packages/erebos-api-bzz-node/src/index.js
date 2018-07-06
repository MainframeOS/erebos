// @flow

import path from 'path'
import BaseBzz from 'erebos-api-bzz-base'
import FormData from 'form-data'
import { writeFile } from 'fs-extra'
import fetch from 'node-fetch'
import tar from 'tar-stream'
import { Observable } from 'rxjs'

export type DirectoryEntry = {
  path: string,
  data: string | Buffer,
}

export default class Bzz extends BaseBzz {
  constructor(url: string) {
    super(url)
    this._fetch = fetch
    this._FormData = FormData
  }

  uploadDirectory(directory: Object) {
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

  downloadDirectoryObservable(hash: string): Observable<DirectoryEntry> {
    return Observable.create(observer => {
      this._fetch(`${this._url}bzz:/${hash}`, {
        headers: {
          Accept: 'application/x-tar',
        },
      }).then(res => {
        if (res.ok) {
          const extract = tar.extract()
          extract.on('entry', (header, stream) => {
            stream.on('data', data => {
              observer.next({ path: header.name, data })
            })
            stream.resume()
          })
          extract.on('finish', () => {
            observer.complete()
          })
          res.body.pipe(extract)
        } else {
          observer.error(new Error(res.statusText))
        }
      })
    })
  }

  downloadDirectory(hash: string): Promise<Object> {
    return new Promise((resolve, reject) => {
      const directoryData = {}
      this.downloadDirectoryObservable(hash).subscribe({
        next: entry => {
          directoryData[entry.path] = { data: entry.data }
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
    return new Promise((resolve, reject) => {
      const writeFiles = []
      this.downloadDirectoryObservable(hash).subscribe({
        next: entry => {
          const filePath = path.join(dirPath, entry.path)
          writeFiles.push(writeFile(filePath, entry.data))
        },
        error: err => {
          reject(err)
        },
        complete: () => {
          // Wait until all files have been written before resolving
          Promise.all(writeFiles).then(
            () => {
              resolve(writeFiles.length)
            },
            err => {
              reject(err)
            },
          )
        },
      })
    })
  }

  downloadBuffer(hash: string, path?: string = ''): Promise<Buffer> {
    return this.download(hash, path).then(res => res.buffer())
  }

  downloadRawBuffer(hash: string): Promise<Buffer> {
    return this.downloadRaw(hash).then(res => res.buffer())
  }
}
