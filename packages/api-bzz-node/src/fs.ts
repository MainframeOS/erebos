import { createWriteStream } from 'fs'
import path from 'path'
import { Readable } from 'stream'
import { ensureDir, stat } from 'fs-extra'
import tarStream from 'tar-stream'

export async function getSize(path: string): Promise<number> {
  const stats = await stat(path)
  return stats.size
}

export async function isFile(path: string): Promise<boolean> {
  const stats = await stat(path)
  return stats.isFile()
}

export async function writeStreamTo(
  stream: Readable,
  filePath: string,
): Promise<void> {
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

export async function extractTarStreamTo(
  stream: Readable,
  dirPath: string,
): Promise<number> {
  await ensureDir(dirPath)
  return await new Promise((resolve, reject) => {
    const extract = tarStream.extract()
    const writeFiles: Array<Promise<void>> = [] // Keep track of files to write
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
    extract.on('error', (err: Error) => {
      reject(err)
    })
    extract.on('finish', () => {
      // Wait until all files have been written before resolving
      Promise.all(writeFiles).then(() => resolve(writeFiles.length), reject)
    })
    stream.pipe(extract)
  })
}
