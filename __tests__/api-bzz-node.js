/**
 * @jest-environment node
 */

import os from 'os'
import path from 'path'
import fs from 'fs-extra'
import tar from 'tar-stream'

import { createKeyPair, pubKeyToAddress } from '../packages/api-bzz-base'
import Bzz from '../packages/api-bzz-node'

describe('bzz-node', () => {
  const TEMP_DIR = path.join(os.tmpdir(), 'erebos-test-temp')
  const bzz = new Bzz('http://localhost:8500/')

  const downloadRawEntries = async entries => {
    return await Promise.all(
      entries.map(e => {
        return bzz.download(e.hash, { mode: 'raw' }).then(r => r.text())
      }),
    )
  }

  const writeTempDir = async dir => {
    await fs.ensureDir(TEMP_DIR)
    await Promise.all(
      Object.keys(dir).map(filePath => {
        return fs.outputFile(path.join(TEMP_DIR, filePath), dir[filePath].data)
      }),
    )
  }

  let uploadContent

  beforeEach(() => {
    fs.removeSync(TEMP_DIR)
    uploadContent = Math.random()
      .toString(36)
      .slice(2)
  })

  it('uploading and downloading single file using bzz', async () => {
    const manifestHash = await bzz.upload(uploadContent, {
      contentType: 'text/plain',
    })
    const response = await bzz.download(manifestHash)
    expect(await response.text()).toBe(uploadContent)
  })

  it('uploading and downloading single file using bzz with content path', async () => {
    const manifestHash = await bzz.upload(uploadContent, {
      contentType: 'text/plain',
    })
    const manifest = await bzz.list(manifestHash)
    const entryHash = manifest.entries[0].hash
    const response = await bzz.download(manifestHash, { path: entryHash })
    expect(await response.text()).toBe(uploadContent)
  })

  it('uploading and downloading single file using bzz-raw', async () => {
    const manifestHash = await bzz.upload(uploadContent)
    const response = await bzz.download(manifestHash, { mode: 'raw' })
    expect(await response.text()).toBe(uploadContent)
  })

  it('downloading the manifest', async () => {
    const manifestHash = await bzz.upload(uploadContent, {
      contentType: 'text/plain',
    })
    const manifest = await bzz.list(manifestHash)
    const entry = manifest.entries[0]
    expect(entry.contentType).toBe('text/plain')
    expect(entry.size).toBe(uploadContent.length)
  })

  it('uploading and downloading single file using bzz using Buffer type', async () => {
    const bufferData = Buffer.from(uploadContent, 'utf8')
    const manifestHash = await bzz.upload(bufferData, {
      contentType: 'application/octet-stream',
    })
    const response = await bzz.download(manifestHash)
    expect(await response.text()).toBe(uploadContent)
  })

  it('uploadDirectory() uploads the contents and returns the hash of the manifest', async () => {
    const dir = {
      [`foo-${uploadContent}.txt`]: {
        data: `this is foo-${uploadContent}.txt`,
        contentType: 'plain/text',
      },
      [`bar-${uploadContent}.txt`]: {
        data: `this is bar-${uploadContent}.txt`,
        contentType: 'plain/text',
      },
    }
    const dirHash = await bzz.uploadDirectory(dir)
    const manifest = await bzz.list(dirHash)
    const entries = Object.values(manifest.entries)
    const downloaded = await downloadRawEntries(entries)
    const downloadedDir = entries.reduce((acc, entry, i) => {
      acc[entry.path] = { data: downloaded[i], contentType: entry.contentType }
      return acc
    }, {})
    expect(downloadedDir).toEqual(dir)
  })

  it('uploadDirectory() supports the `defaultPath` option', async () => {
    const dir = {
      [`foo-${uploadContent}.txt`]: {
        data: `this is foo-${uploadContent}.txt`,
        contentType: 'plain/text',
      },
      [`bar-${uploadContent}.txt`]: {
        data: `this is bar-${uploadContent}.txt`,
        contentType: 'plain/text',
      },
    }
    const defaultPath = `foo-${uploadContent}.txt`
    const dirHash = await bzz.uploadDirectory(dir, { defaultPath })
    const manifest = await bzz.list(dirHash)
    const entries = Object.values(manifest.entries)
    const downloaded = await downloadRawEntries(entries)
    const downloadedDir = entries.reduce((acc, entry, i) => {
      acc[entry.path] = { data: downloaded[i], contentType: entry.contentType }
      return acc
    }, {})
    expect(downloadedDir).toEqual({ ...dir, '/': dir[defaultPath] })
  })

  it('downloadDirectoryData() streams the same data provided to uploadDirectory()', async () => {
    const dir = {
      [`foo-${uploadContent}.txt`]: {
        data: `this is foo-${uploadContent}.txt`,
      },
      [`bar-${uploadContent}.txt`]: {
        data: `this is bar-${uploadContent}.txt`,
      },
    }
    const dirHash = await bzz.uploadDirectory(dir)
    const response = await bzz.downloadDirectoryData(dirHash)
    const downloadedDir = Object.keys(response).reduce(
      (prev, current) => ({
        ...prev,
        [current]: { data: response[current].data.toString('utf8') },
      }),
      {},
    )
    expect(downloadedDir).toEqual(dir)
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

    const dirHash = await bzz.uploadTar(tempFilePath)
    const response = await bzz.downloadDirectoryData(dirHash)
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

    const dirHash = await bzz.uploadDirectoryFrom(TEMP_DIR)
    const response = await bzz.downloadDirectoryData(dirHash)
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
    const dirHash = await bzz.uploadDirectoryFrom(TEMP_DIR, { defaultPath })
    const response = await bzz.downloadDirectoryData(dirHash)
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
    const hash = await bzz.uploadFileFrom(`${TEMP_DIR}/test.txt`, {
      contentType: 'text/plain',
    })
    const response = await bzz.download(hash)
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

    const dirHash = await bzz.uploadFrom(TEMP_DIR)
    const response = await bzz.downloadDirectoryData(dirHash)
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
    const hash = await bzz.uploadFrom(`${TEMP_DIR}/test.txt`, {
      contentType: 'text/plain',
    })
    const response = await bzz.download(hash)
    expect(await response.text()).toBe('hello world')
    await fs.remove(TEMP_DIR)
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
    const numberOfFiles = await bzz.downloadDirectoryTo(dirHash, TEMP_DIR)
    expect(numberOfFiles).toBe(Object.keys(dir).length)
    const downloadedFileNames = fs.readdirSync(TEMP_DIR)
    expect(downloadedFileNames.sort()).toEqual(Object.keys(dir).sort())

    const file1Path = path.join(TEMP_DIR, `foo-${uploadContent}.txt`)
    const file1Content = fs.readFileSync(file1Path, { encoding: 'utf8' })
    const file2Path = path.join(TEMP_DIR, `bar-${uploadContent}.txt`)
    const file2Content = fs.readFileSync(file2Path, { encoding: 'utf8' })
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
    await bzz.downloadFileTo(hash, filePath)
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
    await bzz.downloadTo(dirHash, TEMP_DIR)
    const downloadedFileNames = fs.readdirSync(TEMP_DIR)
    expect(downloadedFileNames.sort()).toEqual(Object.keys(dir).sort())

    const file1Path = path.join(TEMP_DIR, `foo-${uploadContent}.txt`)
    const file1Content = fs.readFileSync(file1Path, { encoding: 'utf8' })
    const file2Path = path.join(TEMP_DIR, `bar-${uploadContent}.txt`)
    const file2Content = fs.readFileSync(file2Path, { encoding: 'utf8' })
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
    await bzz.downloadTo(hash, filePath)
    const downloadedContents = await fs.readFile(filePath)
    expect(downloadedContents.toString('utf8')).toBe(fileContents)
    await fs.remove(TEMP_DIR)
  })

  it('lists directories and files', async () => {
    const expectedCommonPrefixes = ['dir1/', 'dir2/']
    const dirs = {
      [`dir1/foo-${uploadContent}.txt`]: {
        data: `this is foo-${uploadContent}.txt`,
        contentType: 'plain/text',
      },
      [`dir2/bar-${uploadContent}.txt`]: {
        data: `this is bar-${uploadContent}.txt`,
        contentType: 'plain/text',
      },
    }
    const files = {
      [`baz-${uploadContent}.txt`]: {
        data: `this is baz-${uploadContent}.txt`,
        contentType: 'plain/text',
      },
    }
    const dir = { ...dirs, ...files }
    const dirHash = await bzz.uploadDirectory(dir)
    const manifest = await bzz.list(dirHash)
    const entries = Object.values(manifest.entries)
    const downloaded = await downloadRawEntries(entries)
    const downloadedDir = entries.reduce((acc, entry, i) => {
      acc[entry.path] = { data: downloaded[i], contentType: entry.contentType }
      return acc
    }, {})
    expect(files).toEqual(downloadedDir)
    const commonPrefixes = Object.values(manifest.common_prefixes)
    expect(commonPrefixes).toEqual(expectedCommonPrefixes)
  })

  it('supports feeds posting and getting', async () => {
    const keyPair = createKeyPair(
      'feedfeedfeedfeedfeedfeedfeedfeedfeedfeedfeedfeedfeedfeedfeedfeed',
    )
    const address = pubKeyToAddress(keyPair.getPublic())
    const data = { test: uploadContent }
    await bzz.postFeedValue(keyPair, data, { name: uploadContent })
    const res = await bzz.getFeedValue(address, { name: uploadContent })
    const value = await res.json()
    expect(value).toEqual(data)
  })

  it('creates a feed manifest', async () => {
    const keyPair = createKeyPair(
      'feedfeedfeedfeedfeedfeedfeedfeedfeedfeedfeedfeedfeedfeedfeedfeed',
    )
    const address = pubKeyToAddress(keyPair.getPublic())
    const hash = await bzz.createFeedManifest(address, { name: 'manifest' })
    expect(hash).toBeDefined()
  })

  it('uploads data and update the feed value', async () => {
    jest.setTimeout(20000)
    const keyPair = createKeyPair(
      'feedfeedfeedfeedfeedfeedfeedfeedfeedfeedfeedfeedfeedfeedfeedfeed',
    )
    const address = pubKeyToAddress(keyPair.getPublic())
    const manifestHash = await bzz.createFeedManifest(address, {
      name: uploadContent,
    })
    const [dataHash, feedMeta] = await Promise.all([
      bzz.uploadFile('hello', { contentType: 'text/plain' }),
      bzz.getFeedMetadata(manifestHash),
    ])
    await bzz.postFeedValue(keyPair, `0x1b20${dataHash}`, feedMeta.feed)
    const res = await bzz.download(manifestHash)
    const value = await res.text()
    expect(value).toBe('hello')
  })
})
