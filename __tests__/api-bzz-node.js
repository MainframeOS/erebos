/**
 * @jest-environment node
 */

import os from 'os'
import path from 'path'
import fs from 'fs-extra'
import tar from 'tar-stream'

import Bzz from '../packages/api-bzz-node'
import { pubKeyToAddress } from '../packages/keccak256'
import { createKeyPair, sign } from '../packages/secp256k1'

describe('api-bzz-node', () => {
  const TEMP_DIR = path.join(os.tmpdir(), 'erebos-test-temp')

  const sleep = async (time = 1000) => {
    await new Promise(resolve => {
      setTimeout(resolve, time)
    })
  }

  const keyPair = createKeyPair()
  const address = pubKeyToAddress(
    keyPair
      .getPublic()
      .encode()
      .slice(1),
  )

  const bzz = new Bzz({
    signFeedDigest: async digest => sign(digest, keyPair.getPrivate()),
    url: 'http://localhost:8500/',
  })

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
    const data = { test: uploadContent }
    await bzz.updateFeedValue(address, data, { name: uploadContent })
    const res = await bzz.getFeedValue(address, { name: uploadContent })
    const value = await res.json()
    expect(value).toEqual(data)
  })

  it('creates a feed manifest', async () => {
    const hash = await bzz.createFeedManifest(address, { name: 'manifest' })
    expect(hash).toBeDefined()
  })

  it('uploads data and updates the feed value', async () => {
    jest.setTimeout(20000)
    const manifestHash = await bzz.createFeedManifest(address, {
      name: uploadContent,
    })
    await bzz.uploadFeedValue(manifestHash, 'hello', undefined, {
      contentType: 'text/plain',
    })
    const res = await bzz.download(manifestHash)
    const value = await res.text()
    expect(value).toBe('hello')
  })

  it('getFeedValue() supports content modes', async () => {
    jest.setTimeout(20000)

    const feedParams = { name: uploadContent }
    const uploadedHash = await bzz.uploadFeedValue(
      address,
      'hello',
      feedParams,
      { contentType: 'text/plain' },
    )

    const contentHash = await bzz.getFeedValue(address, feedParams, {
      mode: 'content-hash',
    })
    expect(contentHash).toBe(uploadedHash)

    const contentResponse = await bzz.getFeedValue(address, feedParams, {
      mode: 'content-response',
    })
    const value = await contentResponse.text()
    expect(value).toBe('hello')
  })

  it('supports feed value polling', async () => {
    jest.setTimeout(60000)

    let step = '0-idle'
    let expectedValue

    let completeTest
    const testPromise = new Promise(resolve => {
      completeTest = resolve
    })

    const subscription = bzz
      .pollFeedValue(address, { name: uploadContent }, { interval: 2000 })
      .subscribe(async res => {
        if (res === null) {
          if (step === '0-idle') {
            step = '1-first-value-post'
            await bzz.updateFeedValue(address, 'hello', { name: uploadContent })
            expectedValue = 'hello'
            step = '2-first-value-posted'
          }
        } else {
          const value = await res.text()
          if (step === '2-first-value-posted') {
            expect(value).toBe(expectedValue)
            step = '3-first-value-received'
            await sleep(5000)
            step = '4-second-value-post'
            await bzz.updateFeedValue(address, 'world', { name: uploadContent })
            expectedValue = 'world'
            step = '5-second-value-posted'
          } else if (step === '5-second-value-posted') {
            expect(value).toBe(expectedValue)
            subscription.unsubscribe()
            step = '6-unsubscribed'
            await sleep(5000)
            completeTest()
          } else if (step === '6-unsubscribed') {
            throw new Error('Event received after unsubscribed')
          }
        }
      })

    await testPromise
  })

  it('supports feed value polling in "content-hash" mode', async () => {
    jest.setTimeout(60000)

    const post = async value => {
      return await bzz.uploadFeedValue(
        address,
        value,
        { name: uploadContent },
        { contentType: 'text/plain' },
      )
    }

    let step = '0-idle'
    let expectedHash
    let previousValue

    let completeTest
    const testPromise = new Promise(resolve => {
      completeTest = resolve
    })

    const subscription = bzz
      .pollFeedValue(
        address,
        { name: uploadContent },
        {
          interval: 5000,
          mode: 'content-hash',
          contentChangedOnly: true,
        },
      )
      .subscribe(async value => {
        if (value === null) {
          if (step === '0-idle') {
            step = '1-first-value-post'
            expectedHash = await post('hello')
            step = '2-first-value-posted'
          }
        } else {
          expect(value).not.toBe(previousValue)
          previousValue = value

          if (step === '2-first-value-posted') {
            expect(value).toBe(expectedHash)
            step = '3-first-value-received'
            await sleep(8000)
            step = '4-second-value-post'
            expectedHash = await post('world')
            step = '5-second-value-posted'
          } else if (step === '5-second-value-posted') {
            expect(value).toBe(expectedHash)
            subscription.unsubscribe()
            completeTest()
          }
        }
      })

    await testPromise
  })

  it('supports feed value polling in "content-response" mode', async () => {
    jest.setTimeout(60000)

    const post = async value => {
      return await bzz.uploadFeedValue(
        address,
        value,
        { name: uploadContent },
        { contentType: 'text/plain' },
      )
    }

    let step = '0-idle'
    let expectedValue

    let completeTest
    const testPromise = new Promise(resolve => {
      completeTest = resolve
    })

    const subscription = bzz
      .pollFeedValue(
        address,
        { name: uploadContent },
        {
          interval: 5000,
          mode: 'content-response',
          contentChangedOnly: true,
        },
      )
      .subscribe(async res => {
        if (res === null) {
          if (step === '0-idle') {
            step = '1-first-value-post'
            await post('hello')
            expectedValue = 'hello'
            step = '2-first-value-posted'
          }
        } else {
          const value = await res.text()

          if (step === '2-first-value-posted') {
            expect(value).toBe(expectedValue)
            step = '3-first-value-received'
            await sleep(8000)
            step = '4-second-value-post'
            await post('world')
            expectedValue = 'world'
            step = '5-second-value-posted'
          } else if (step === '5-second-value-posted') {
            expect(value).toBe(expectedValue)
            subscription.unsubscribe()
            completeTest()
          }
        }
      })

    await testPromise
  })

  it('feed polling fails on not found error if the option is enabled', async () => {
    await new Promise((resolve, reject) => {
      bzz
        .pollFeedValue(
          address,
          { name: 'notfound' },
          { whenEmpty: 'error', immediate: false },
        )
        .subscribe({
          next: () => {
            reject(new Error('Subscription should not have emitted a value'))
          },
          error: () => {
            resolve()
          },
        })
    })
  })
})
