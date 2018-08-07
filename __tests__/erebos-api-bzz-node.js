/**
 * @jest-environment node
 */

import os from 'os'
import path from 'path'
import fs from 'fs-extra'
import tar from 'tar-stream'
import Bzz from '../packages/erebos-api-bzz-node'

describe('bzz-node', () => {
  let uploadContent
  const url = 'http://localhost:8500/'
  const bzz = new Bzz(url)
  const tempDirPath = path.join(os.tmpdir(), 'erebos-test-temp')

  beforeEach(() => {
    fs.removeSync(tempDirPath)
  })

  beforeEach(() => {
    uploadContent = Math.random()
      .toString(36)
      .slice(2)
  })

  it('trying to upload without specifying content-type fails', async () => {
    const uploadRequest = bzz.upload(uploadContent)
    expect(uploadRequest).rejects.toThrow('Bad Request')
  })

  it('uploading and downloading single file using bzz', async () => {
    const headers = { 'Content-Type': 'text/plain' }
    const manifestHash = await bzz.upload(uploadContent, headers)

    const response = await bzz.download(manifestHash)
    expect(await response.text()).toBe(uploadContent)

    const text = await bzz.downloadText(manifestHash)
    expect(text).toBe(uploadContent)

    const buffer = await bzz.downloadBuffer(manifestHash)
    expect(buffer.toString('utf8')).toBe(uploadContent)
  })

  it('uploading and downloading single file using bzz with content path', async () => {
    const headers = { 'Content-Type': 'text/plain' }
    const manifestHash = await bzz.upload(uploadContent, headers)

    const manifest = await bzz.downloadRawText(manifestHash)
    const entryHash = JSON.parse(manifest).entries[0].hash
    const response = await bzz.download(manifestHash, entryHash)
    expect(await response.text()).toBe(uploadContent)

    const text = await bzz.downloadText(manifestHash, entryHash)
    expect(text).toBe(uploadContent)

    const buffer = await bzz.downloadBuffer(manifestHash, entryHash)
    expect(buffer.toString('utf8')).toBe(uploadContent)
  })

  it('uploading and downloading single file using bzz-raw', async () => {
    const hash = await bzz.uploadRaw(uploadContent)

    const response = await bzz.downloadRaw(hash)
    expect(await response.text()).toBe(uploadContent)

    const text = await bzz.downloadRawText(hash)
    expect(text).toBe(uploadContent)

    const buffer = await bzz.downloadRawBuffer(hash)
    expect(buffer.toString('utf8')).toBe(uploadContent)
  })

  it('downloading the manifest', async () => {
    const headers = { 'Content-Type': 'text/plain' }
    const manifestHash = await bzz.upload(uploadContent, headers)

    // Requesting manifestHash with bzz-raw directly returns the manifest file
    const manifest = await bzz.downloadRawText(manifestHash)
    const entry = JSON.parse(manifest).entries[0]
    expect(entry.contentType).toBe('text/plain')
    expect(entry.size).toBe(uploadContent.length)
  })

  it('uploading and downloading single file using bzz using Buffer type', async () => {
    const bufferData = Buffer.from(uploadContent, 'utf8')
    const headers = { 'Content-Type': 'application/octet-stream' }
    const manifestHash = await bzz.upload(bufferData, headers)

    const response = await bzz.download(manifestHash)
    expect(await response.text()).toBe(uploadContent)

    const text = await bzz.downloadText(manifestHash)
    expect(text).toBe(uploadContent)

    const buffer = await bzz.downloadBuffer(manifestHash)
    expect(buffer.toString('utf8')).toBe(uploadContent)
  })

  it('uploadDirectory() uploads the contents and returns the hash of the manifest', async () => {
    const dir = {
      [`foo-${uploadContent}.txt`]: {
        data: `this is foo-${uploadContent}.txt`,
      },
      [`bar-${uploadContent}.txt`]: {
        data: `this is bar-${uploadContent}.txt`,
      },
    }
    const dirHash = await bzz.uploadDirectory(dir)
    const manifest = await bzz.downloadRawText(dirHash)
    const entries = Object.values(JSON.parse(manifest).entries)
    const downloaded = await Promise.all(
      entries.map(entry => bzz.downloadRawText(entry.hash)),
    )
    const downloadedDir = entries.reduce((acc, entry, i) => {
      acc[entry.path] = { data: downloaded[i] }
      return acc
    }, {})
    expect(dir).toEqual(downloadedDir)
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
    expect(dir).toEqual(downloadedDir)
  })

  it('upload directory data using uploadTarData()', async () => {
    const dir = {
      [`foo-${uploadContent}.txt`]: {
        data: `this is foo-${uploadContent}.txt`,
      },
      [`bar-${uploadContent}.txt`]: {
        data: `this is bar-${uploadContent}.txt`,
      },
    }
    const dirHash = await bzz.uploadTarData(dir)

    const response = await bzz.downloadDirectoryData(dirHash)
    const downloadedDir = Object.keys(response).reduce(
      (prev, current) => ({
        ...prev,
        [current]: { data: response[current].data.toString('utf8') },
      }),
      {},
    )
    expect(dir).toEqual(downloadedDir)
  })

  it('upload tar file using uploadTarFile()', async () => {
    const dir = {
      [`foo-${uploadContent}.txt`]: {
        data: `this is foo-${uploadContent}.txt`,
      },
      [`bar-${uploadContent}.txt`]: {
        data: `this is bar-${uploadContent}.txt`,
      },
    }

    const tempFilePath = path.join(tempDirPath, 'test-data.tar')
    await fs.ensureDir(tempDirPath)
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

    const dirHash = await bzz.uploadTarFile(tempFilePath)
    const response = await bzz.downloadDirectoryData(dirHash)
    const downloadedDir = Object.keys(response).reduce(
      (prev, current) => ({
        ...prev,
        [current]: { data: response[current].data.toString('utf8') },
      }),
      {},
    )
    expect(dir).toEqual(downloadedDir)
    await fs.remove(tempDirPath)
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

    await fs.ensureDir(tempDirPath)
    Promise.all([
      fs.outputFile(
        path.join(tempDirPath, `foo-${uploadContent}.txt`),
        `this is foo-${uploadContent}.txt`,
      ),
      fs.outputFile(
        path.join(tempDirPath, `bar-${uploadContent}.txt`),
        `this is bar-${uploadContent}.txt`,
      ),
    ])

    const dirHash = await bzz.uploadDirectoryFrom(tempDirPath)
    const response = await bzz.downloadDirectoryData(dirHash)
    const downloadedDir = Object.keys(response).reduce(
      (prev, current) => ({
        ...prev,
        [current]: { data: response[current].data.toString('utf8') },
      }),
      {},
    )
    expect(dir).toEqual(downloadedDir)
    await fs.remove(tempDirPath)
  })
})
