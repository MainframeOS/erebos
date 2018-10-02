// @flow

import { createReadStream, createWriteStream } from 'fs'
import path from 'path'
import type { Readable } from 'stream'
import { ensureDir, lstat } from 'fs-extra'
import tarFS from 'tar-fs'
import tarStream from 'tar-stream'

import type { UploadOptions } from '@erebos/api-bzz-base'

export const isFile = async (path: string): Promise<boolean> => {
  const stat = await lstat(path)
  return stat.isFile()
}

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
  return tarFS.pack(tarPath, {
    finalize: false,
    finish: async pack => {
      try {
        const filePath = path.join(tarPath, defaultPath)
        const stat = await lstat(filePath)
        const entry = pack.entry({ name: '', size: stat.size }, () => {
          pack.finalize()
        })
        createReadStream(filePath).pipe(entry)
      } catch (err) {
        pack.finalize()
      }
    },
  })
}

export const packTar = (
  path: string,
  options?: UploadOptions = {},
): Readable => {
  return options.defaultPath
    ? packTarWithDefault(path, options.defaultPath)
    : tarFS.pack(path)
}
