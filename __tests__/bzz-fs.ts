import * as os from 'os'
import * as path from 'path'
import * as fs from 'fs-extra'
import * as tar from 'tar-stream'

import { BzzFS } from '@erebos/bzz-fs'
import { BzzNode } from '@erebos/bzz-node'

describe('bzz-fs', () => {
  const TEMP_DIR = path.join(os.tmpdir(), 'erebos-test-temp')

  const bzz = new BzzNode({ url: 'http://localhost:8500' })
  const bzzFS = new BzzFS({ bzz })

  const writeTempDir = async (
    dir: Record<string, { data: string }>,
  ): Promise<void> => {
    await fs.ensureDir(TEMP_DIR)
    await Promise.all(
      Object.keys(dir).map(filePath => {
        return fs.outputFile(path.join(TEMP_DIR, filePath), dir[filePath].data)
      }),
    )
  }

  let uploadContent: string

  beforeEach(() => {
    fs.removeSync(TEMP_DIR)
    uploadContent = Math.random()
      .toString(36)
      .slice(2)
  })

  it('upload tar file using uploadTar()', async () => {
    const dir = {
      [`foo-${uploadContent}.txt`]: {
        data: `this is foo-${uploadContent}.txt`,
      },
      [`bar-${uploadContent}.txt`]: {
        data: `this is bar-${uploadContent}.txt`,
      },
    }

    const tempFilePath = path.join(TEMP_DIR, 'test-data.tar')
    await fs.ensureDir(TEMP_DIR)
    const tarFile = fs.createWriteStream(tempFilePath)

    const pack = tar.pack()
    pack.entry(
      { name: `foo-${uploadContent}.txt` },
      `this is foo-${uploadContent}.txt`,
    )
    pack.entry(
      { name: `bar-${uploadContent}.txt` },
      `this is bar-${uploadContent}.txt`,
    )
    pack.finalize()
    pack.pipe(tarFile)

    const dirHash = await bzzFS.uploadTar(tempFilePath)
    const response = await bzz.downloadDirectory(dirHash)
    const downloadedDir = Object.keys(response).reduce(
      (prev, current) => ({
        ...prev,
        [current]: { data: response[current].data.toString('utf8') },
      }),
      {},
    )
    expect(downloadedDir).toEqual(dir)
    await fs.remove(TEMP_DIR)
  })

  it('upload directory of files using uploadDirectoryFrom()', async () => {
    jest.setTimeout(10000) // 10 secs
    const dir = {
      [`foo-${uploadContent}.txt`]: {
        data: `this is foo-${uploadContent}.txt`,
      },
      [`bar-${uploadContent}.txt`]: {
        data: `this is bar-${uploadContent}.txt`,
      },
    }
    await writeTempDir(dir)

    const dirHash = await bzzFS.uploadDirectoryFrom(TEMP_DIR)
    const response = await bzz.downloadDirectory(dirHash)
    const downloadedDir = Object.keys(response).reduce(
      (prev, current) => ({
        ...prev,
        [current]: { data: response[current].data.toString('utf8') },
      }),
      {},
    )
    expect(downloadedDir).toEqual(dir)
    await fs.remove(TEMP_DIR)
  })

  it('upload a directory with defaultPath using uploadDirectoryFrom()', async () => {
    jest.setTimeout(10000) // 10 secs
    const dir = {
      [`foo-${uploadContent}.txt`]: {
        data: `this is foo-${uploadContent}.txt`,
      },
      [`bar-${uploadContent}.txt`]: {
        data: `this is bar-${uploadContent}.txt`,
      },
    }
    await writeTempDir(dir)

    const defaultPath = `foo-${uploadContent}.txt`
    const dirHash = await bzzFS.uploadDirectoryFrom(TEMP_DIR, { defaultPath })
    const response = await bzz.downloadDirectory(dirHash)
    const downloadedDir = Object.keys(response).reduce(
      (prev, current) => ({
        ...prev,
        [current]: { data: response[current].data.toString('utf8') },
      }),
      {},
    )
    expect(downloadedDir).toEqual({ ...dir, '': dir[defaultPath] })
    await fs.remove(TEMP_DIR)
  })

  it('upload a single file using uploadFileFrom()', async () => {
    jest.setTimeout(10000) // 10 secs
    await writeTempDir({
      'test.txt': {
        data: 'hello world',
      },
    })
    const hash = await bzzFS.uploadFileFrom(`${TEMP_DIR}/test.txt`, {
      contentType: 'text/plain',
    })
    const response = await bzz.download(hash)
    expect(await response.text()).toBe('hello world')
    await fs.remove(TEMP_DIR)
  })

  it('upload a single raw file using uploadFileFrom()', async () => {
    jest.setTimeout(10000) // 10 secs
    await writeTempDir({
      'test.txt': {
        data: 'hello world',
      },
    })
    const hash = await bzzFS.uploadFileFrom(`${TEMP_DIR}/test.txt`)
    const response = await bzz.download(hash, { mode: 'raw' })
    expect(await response.text()).toBe('hello world')
    await fs.remove(TEMP_DIR)
  })

  it('upload directory of files using uploadFrom() when a folder path is provided', async () => {
    jest.setTimeout(10000) // 10 secs
    const dir = {
      [`foo-${uploadContent}.txt`]: {
        data: `this is foo-${uploadContent}.txt`,
      },
      [`bar-${uploadContent}.txt`]: {
        data: `this is bar-${uploadContent}.txt`,
      },
    }
    await writeTempDir(dir)

    const dirHash = await bzzFS.uploadFrom(TEMP_DIR)
    const response = await bzz.downloadDirectory(dirHash)
    const downloadedDir = Object.keys(response).reduce(
      (prev, current) => ({
        ...prev,
        [current]: { data: response[current].data.toString('utf8') },
      }),
      {},
    )
    expect(downloadedDir).toEqual(dir)
    await fs.remove(TEMP_DIR)
  })

  it('upload a single file using uploadFrom() when a file path is provided', async () => {
    jest.setTimeout(10000) // 10 secs
    await writeTempDir({
      'test.txt': {
        data: 'hello world',
      },
    })
    const hash = await bzzFS.uploadFrom(`${TEMP_DIR}/test.txt`, {
      contentType: 'text/plain',
    })
    const response = await bzz.download(hash)
    expect(await response.text()).toBe('hello world')
    await fs.remove(TEMP_DIR)
  })

  it('download a tar file to the provided path', async () => {
    const filePath = `${TEMP_DIR}/archive.tar`
    const existsBefore = await fs.pathExists(filePath)
    expect(existsBefore).toBe(false)

    const hash = await bzz.uploadDirectory({
      'file.txt': {
        data: 'hello test',
      },
    })
    await bzzFS.downloadTarTo(hash, filePath)

    const existsAfter = await fs.pathExists(filePath)
    expect(existsAfter).toBe(true)
  })

  it('download directory of files using downloadDirectoryTo()', async () => {
    const dir = {
      [`foo-${uploadContent}.txt`]: {
        data: `this is foo-${uploadContent}.txt`,
      },
      [`bar-${uploadContent}.txt`]: {
        data: `this is bar-${uploadContent}.txt`,
      },
    }

    const dirHash = await bzz.uploadDirectory(dir)
    const numberOfFiles = await bzzFS.downloadDirectoryTo(dirHash, TEMP_DIR)
    expect(numberOfFiles).toBe(Object.keys(dir).length)
    const downloadedFileNames = await fs.readdir(TEMP_DIR)
    expect(downloadedFileNames.sort()).toEqual(Object.keys(dir).sort())

    const file1Path = path.join(TEMP_DIR, `foo-${uploadContent}.txt`)
    const file2Path = path.join(TEMP_DIR, `bar-${uploadContent}.txt`)
    const [file1Content, file2Content] = await Promise.all([
      fs.readFile(file1Path, { encoding: 'utf8' }),
      fs.readFile(file2Path, { encoding: 'utf8' }),
    ])
    expect(file1Content).toEqual(dir[`foo-${uploadContent}.txt`].data)
    expect(file2Content).toEqual(dir[`bar-${uploadContent}.txt`].data)
    await fs.remove(TEMP_DIR)
  })

  it('download a single file using downloadFileTo()', async () => {
    const fileContents = 'test'
    const filePath = `${TEMP_DIR}/test.txt`
    const hash = await bzz.uploadFile(fileContents, {
      contentType: 'text/plain',
    })
    await bzzFS.downloadFileTo(hash, filePath)
    const downloadedContents = await fs.readFile(filePath)
    expect(downloadedContents.toString('utf8')).toBe(fileContents)
    await fs.remove(TEMP_DIR)
  })

  it('download directory of files using downloadTo() when a folder path is provided', async () => {
    const dir = {
      [`foo-${uploadContent}.txt`]: {
        data: `this is foo-${uploadContent}.txt`,
      },
      [`bar-${uploadContent}.txt`]: {
        data: `this is bar-${uploadContent}.txt`,
      },
    }

    const dirHash = await bzz.uploadDirectory(dir)
    await fs.ensureDir(TEMP_DIR)
    await bzzFS.downloadTo(dirHash, TEMP_DIR)
    const downloadedFileNames = await fs.readdir(TEMP_DIR)
    expect(downloadedFileNames.sort()).toEqual(Object.keys(dir).sort())

    const file1Path = path.join(TEMP_DIR, `foo-${uploadContent}.txt`)
    const file2Path = path.join(TEMP_DIR, `bar-${uploadContent}.txt`)
    const [file1Content, file2Content] = await Promise.all([
      fs.readFile(file1Path, { encoding: 'utf8' }),
      fs.readFile(file2Path, { encoding: 'utf8' }),
    ])
    expect(file1Content).toEqual(dir[`foo-${uploadContent}.txt`].data)
    expect(file2Content).toEqual(dir[`bar-${uploadContent}.txt`].data)
    await fs.remove(TEMP_DIR)
  })

  it('download a single file using downloadTo() when a file path is provided', async () => {
    const fileContents = 'test'
    const filePath = `${TEMP_DIR}/test.txt`
    const hash = await bzz.uploadFile(fileContents, {
      contentType: 'text/plain',
    })
    await fs.ensureDir(TEMP_DIR)
    await fs.open(filePath, 'w')
    await bzzFS.downloadTo(hash, filePath)
    const downloadedContents = await fs.readFile(filePath)
    expect(downloadedContents.toString('utf8')).toBe(fileContents)
    await fs.remove(TEMP_DIR)
  })
})
