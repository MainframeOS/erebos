/**
 * @jest-environment node
 */

import * as os from 'os'
import * as path from 'path'
import * as fs from 'fs-extra'
import { Subject } from 'rxjs'
import * as tar from 'tar-stream'

import { Bzz, DirectoryEntry, ListEntry } from '@erebos/api-bzz-node'
import { hexValue } from '@erebos/hex'
import { pubKeyToAddress } from '@erebos/keccak256'
import { createKeyPair, sign } from '@erebos/secp256k1'

describe('api-bzz-node', () => {
  const TEMP_DIR = path.join(os.tmpdir(), 'erebos-test-temp')

  const sleep = async (time = 1000): Promise<void> => {
    await new Promise(resolve => {
      setTimeout(resolve, time)
    })
  }

  const keyPair = createKeyPair()
  const user = pubKeyToAddress(keyPair.getPublic('array'))

  const bzz = new Bzz({
    signBytes: (bytes: Array<number>) => Promise.resolve(sign(bytes, keyPair)),
    url: 'http://localhost:8500',
  })

  const downloadRawEntries = async (
    entries: Array<ListEntry>,
  ): Promise<Array<string>> => {
    return await Promise.all(
      entries.map(e => {
        return bzz.download(e.hash, { mode: 'raw' }).then(r => r.text())
      }),
    )
  }

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
    const manifestHash = await bzz.upload(Buffer.from(uploadContent), {
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
    const entries = Object.values(manifest.entries || {})
    const downloaded = await downloadRawEntries(entries)
    const downloadedDir = entries.reduce(
      (acc, entry, i) => {
        acc[entry.path] = {
          data: downloaded[i],
          contentType: entry.contentType,
        }
        return acc
      },
      {} as Record<string, DirectoryEntry>,
    )
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
    const entries = Object.values(manifest.entries || {})
    const downloaded = await downloadRawEntries(entries)
    const downloadedDir = entries.reduce(
      (acc, entry, i) => {
        acc[entry.path] = {
          data: downloaded[i],
          contentType: entry.contentType,
        }
        return acc
      },
      {} as Record<string, DirectoryEntry>,
    )
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

  it('upload a single raw file using uploadFileFrom()', async () => {
    jest.setTimeout(10000) // 10 secs
    await writeTempDir({
      'test.txt': {
        data: 'hello world',
      },
    })
    const hash = await bzz.uploadFileFrom(`${TEMP_DIR}/test.txt`)
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

  it('download a tar file to the provided path', async () => {
    const filePath = `${TEMP_DIR}/archive.tar`
    const existsBefore = await fs.pathExists(filePath)
    expect(existsBefore).toBe(false)

    const hash = await bzz.uploadDirectory({
      'file.txt': {
        data: 'hello test',
      },
    })
    await bzz.downloadTarTo(hash, filePath)

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
    const numberOfFiles = await bzz.downloadDirectoryTo(dirHash, TEMP_DIR)
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
    const params = { user, name: uploadContent }
    const data = { test: uploadContent }
    await bzz.setFeedChunk(params, data)
    const res = await bzz.getFeedChunk(params)
    const value = await res.json()
    expect(value).toEqual(data)
  })

  it('creates a feed manifest', async () => {
    const hash = await bzz.createFeedManifest({ user, name: 'manifest' })
    expect(hash).toBeDefined()
  })

  it('uploads data and sets the feed chunk', async () => {
    jest.setTimeout(20000)
    const manifestHash = await bzz.createFeedManifest({
      user,
      name: uploadContent,
    })
    await bzz.setFeedContent(manifestHash, 'hello', {
      contentType: 'text/plain',
    })
    const res = await bzz.download(manifestHash)
    const value = await res.text()
    expect(value).toBe('hello')
  })

  it('sets and gets the feed content hash', async () => {
    const feedParams = { user, name: uploadContent }
    const uploadedHash = await bzz.upload('hello', {
      contentType: 'text/plain',
    })
    await bzz.setFeedContentHash(feedParams, uploadedHash)
    const contentHash = await bzz.getFeedContentHash(feedParams)
    expect(contentHash).toBe(uploadedHash)
  })

  it('sets and gets the feed content', async () => {
    const feedParams = { user, name: uploadContent }
    await bzz.setFeedContent(feedParams, 'hello', {
      contentType: 'text/plain',
    })
    const res = await bzz.getFeedContent(feedParams)
    const text = await res.text()
    expect(text).toBe('hello')
  })

  it('supports feed chunk polling', done => {
    jest.setTimeout(40000)

    let step = '0-idle'
    let expectedValue: string

    const params = { user, name: uploadContent }
    const subscription = bzz
      .pollFeedChunk(params, { interval: 2000 })
      // eslint-disable-next-line @typescript-eslint/no-misused-promises
      .subscribe(async res => {
        /* eslint-disable require-atomic-updates */
        if (res === null) {
          if (step === '0-idle') {
            step = '1-first-value-post'
            await bzz.setFeedChunk(params, 'hello')
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
            await bzz.setFeedChunk(params, 'world')
            expectedValue = 'world'
            step = '5-second-value-posted'
          } else if (step === '5-second-value-posted') {
            expect(value).toBe(expectedValue)
            subscription.unsubscribe()
            step = '6-unsubscribed'
            await sleep(5000)
            done()
          } else if (step === '6-unsubscribed') {
            throw new Error('Event received after unsubscribed')
          }
        }
        /* eslint-enable require-atomic-updates */
      })
  })

  it('supports feed content hash polling', done => {
    jest.setTimeout(40000)

    const params = { user, name: uploadContent }
    const post = async (value: string): Promise<hexValue> => {
      return await bzz.setFeedContent(params, value, {
        contentType: 'text/plain',
      })
    }

    let step = '0-idle'
    let expectedHash: string
    let previousValue: string

    const subscription = bzz
      .pollFeedContentHash(params, {
        interval: 5000,
        changedOnly: true,
      })
      // eslint-disable-next-line @typescript-eslint/no-misused-promises
      .subscribe(async value => {
        /* eslint-disable require-atomic-updates */
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
            done()
          }
        }
        /* eslint-enable require-atomic-updates */
      })
  })

  it('supports feed content polling', done => {
    jest.setTimeout(40000)

    const params = { user, name: uploadContent }
    const post = async (value: string): Promise<hexValue> => {
      return await bzz.setFeedContent(params, value, {
        contentType: 'text/plain',
      })
    }

    let step = '0-idle'
    let expectedValue: string

    const subscription = bzz
      .pollFeedContent(params, {
        interval: 5000,
        changedOnly: true,
      })
      // eslint-disable-next-line @typescript-eslint/no-misused-promises
      .subscribe(async res => {
        /* eslint-disable require-atomic-updates */
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
            done()
          }
        }
        /* eslint-enable require-atomic-updates */
      })
  })

  it('feed polling fails on not found error if the option is enabled', done => {
    jest.setTimeout(10000)

    bzz
      .pollFeedChunk(
        { user, name: 'notfound' },
        { interval: 2000, whenEmpty: 'error', immediate: false },
      )
      .subscribe({
        next: () => {
          throw new Error('Subscription should not have emitted a value')
        },
        error: () => {
          done()
        },
      })
  })

  it('feed polling accepts an external trigger', done => {
    const trigger: Subject<void> = new Subject()
    const subscription = bzz
      .pollFeedChunk(
        { user, name: 'notfound' },
        { interval: 10000, immediate: false, trigger },
      )
      .subscribe(() => {
        subscription.unsubscribe()
        done()
      })
    // Test should timeout if the trigger is not executed
    trigger.next()
  })

  it('checks if pinning is enabled', async () => {
    const enabled = await bzz.pinEnabled()
    expect(enabled).toBe(true)
  })

  it('pins when uploading', async () => {
    const pinsBefore = await bzz.pins()
    await Promise.all(pinsBefore.map(p => bzz.unpin(p.address)))

    const hash = await bzz.uploadFile(uploadContent, { pin: true })
    const pins = await bzz.pins()
    expect(pins.length).toBe(1)
    expect(pins[0]).toEqual({
      address: hash,
      counter: 1,
      raw: true,
      size: uploadContent.length,
    })

    await bzz.unpin(hash)
    const pinsAfter = await bzz.pins()
    expect(pinsAfter.length).toBe(0)
  })

  it('pins an already uploaded raw file', async () => {
    const pinsBefore = await bzz.pins()
    await Promise.all(pinsBefore.map(p => bzz.unpin(p.address)))

    const hash = await bzz.uploadFile(uploadContent)
    await bzz.pin(hash, { raw: true })

    const pins = await bzz.pins()
    expect(pins.length).toBe(1)
    expect(pins[0]).toEqual({
      address: hash,
      counter: 1,
      raw: true,
      size: uploadContent.length,
    })

    await bzz.unpin(hash)
    const pinsAfter = await bzz.pins()
    expect(pinsAfter.length).toBe(0)
  })

  it('pins a manifest', async () => {
    const pinsBefore = await bzz.pins()
    await Promise.all(pinsBefore.map(p => bzz.unpin(p.address)))

    const hash = await bzz.uploadFile(uploadContent, {
      contentType: 'text/plain',
    })
    await bzz.pin(hash)

    const pins = await bzz.pins()
    expect(pins.length).toBe(1)
    expect(pins[0].address).toBe(hash)
    expect(pins[0].raw).toBe(false)

    await bzz.unpin(hash)
    const pinsAfter = await bzz.pins()
    expect(pinsAfter.length).toBe(0)
  })

  it('gets an upload tag', async () => {
    const hash = await bzz.uploadFile(uploadContent, {
      contentType: 'text/plain',
    })
    const tag = await bzz.getTag(hash)
    expect(tag.address).toBe(hash)
  })

  it('polls an upload tag', async done => {
    const hash = await bzz.uploadFile(uploadContent, {
      contentType: 'text/plain',
    })

    let count = 0
    const sub = bzz.pollTag(hash, { interval: 300 }).subscribe({
      next: tag => {
        expect(tag.address).toBe(hash)
        if (count++ === 3) {
          sub.unsubscribe()
          done()
        }
      },
    })
  })
})
