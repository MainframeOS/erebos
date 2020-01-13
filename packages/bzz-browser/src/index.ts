import {
  Bzz,
  DirectoryData,
  DownloadOptions,
  UploadOptions,
  Response,
} from '@erebos/bzz'
import tarStream from 'tar-stream'

export * from '@erebos/bzz'

type Readable = ReadableStream<Uint8Array>

export class BzzBrowser extends Bzz<Readable, Response<Readable>, FormData> {
  public async downloadDirectory(
    hash: string,
    options: DownloadOptions = {},
  ): Promise<DirectoryData> {
    const directoryData: DirectoryData = {}

    const extract = tarStream.extract()
    const finished = new Promise(resolve => {
      extract.on('finish', () => {
        resolve()
      })
    })

    extract.on('entry', (header, stream, next) => {
      if (header.type === 'file') {
        const chunks: Array<Uint8Array> = []
        stream.on('data', (chunk: Uint8Array) => {
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

    const writeChunk = (chunk: Uint8Array): Promise<void> => {
      return new Promise((resolve, reject) => {
        extract.write(chunk, err => {
          if (err == null) resolve()
          else reject(err)
        })
      })
    }

    const res = await this.downloadTar(hash, options)
    const reader = res.body.getReader()

    let chunk = await reader.read()
    while (!chunk.done) {
      await writeChunk(chunk.value)
      chunk = await reader.read()
    }
    extract.end()

    await finished
    return directoryData
  }

  public async uploadDirectory(
    directory: DirectoryData,
    options: UploadOptions = {},
  ): Promise<string> {
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
