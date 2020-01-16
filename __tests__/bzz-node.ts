import { Readable } from 'stream'

import { BzzNode, DirectoryEntry, ListEntry } from '@erebos/bzz-node'

describe('bzz-node', () => {
  const bzz = new BzzNode({ url: 'http://localhost:8500' })

  const downloadRawEntries = async (
    entries: Array<ListEntry>,
  ): Promise<Array<string>> => {
    return await Promise.all(
      entries.map(e => {
        return bzz.download(e.hash, { mode: 'raw' }).then(r => r.text())
      }),
    )
  }

  let uploadContent: string
  beforeEach(() => {
    uploadContent = Math.random()
      .toString(36)
      .slice(2)
  })

  it('uploading and downloading single file using bzz', async () => {
    const manifestHash = await bzz.uploadFile(uploadContent, {
      contentType: 'text/plain',
    })
    const response = await bzz.download(manifestHash)
    expect(await response.text()).toBe(uploadContent)
  })

  it('uploading and downloading single file using bzz and streams', async () => {
    const s = new Readable()
    s.push(uploadContent)
    s.push(null)

    const manifestHash = await bzz.uploadFile(s, {
      contentType: 'text/plain',
    })

    const data: Array<Uint8Array> = []
    const res = await bzz.download(manifestHash)
    const stream = res.body
    stream.on('data', (d: Uint8Array) => {
      data.push(d)
    })

    return new Promise(resolve => {
      stream.on('end', () => {
        expect(Buffer.concat(data).toString()).toBe(uploadContent)
        resolve()
      })
    })
  })

  it('uploading and downloading single file using bzz with content path', async () => {
    const manifestHash = await bzz.uploadFile(uploadContent, {
      contentType: 'text/plain',
    })
    const manifest = await bzz.list(manifestHash)
    const entryHash = manifest.entries[0].hash
    const response = await bzz.download(manifestHash, { path: entryHash })
    expect(await response.text()).toBe(uploadContent)
  })

  it('uploading and downloading single file using bzz-raw', async () => {
    const manifestHash = await bzz.uploadFile(uploadContent)
    const response = await bzz.download(manifestHash, { mode: 'raw' })
    expect(await response.text()).toBe(uploadContent)
  })

  it('uploading and downloading single file using bzz-raw and streams', async () => {
    const s = new Readable()
    s.push(uploadContent)
    s.push(null)

    const manifestHash = await bzz.uploadFile(s, { size: uploadContent.length })

    const data: Array<Uint8Array> = []
    const res = await bzz.download(manifestHash, { mode: 'raw' })
    const stream = res.body
    stream.on('data', (d: Uint8Array) => {
      data.push(d)
    })

    return new Promise(resolve => {
      stream.on('end', () => {
        expect(Buffer.concat(data).toString()).toBe(uploadContent)
        resolve()
      })
    })
  })

  it('downloading the manifest', async () => {
    const manifestHash = await bzz.uploadFile(uploadContent, {
      contentType: 'text/plain',
    })
    const manifest = await bzz.list(manifestHash)
    const entry = manifest.entries[0]
    expect(entry.contentType).toBe('text/plain')
    expect(entry.size).toBe(uploadContent.length)
  })

  it('uploading and downloading single file using bzz using Buffer type', async () => {
    const manifestHash = await bzz.uploadFile(Buffer.from(uploadContent), {
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
    const downloadedDir = entries.reduce((acc, entry, i) => {
      acc[entry.path] = {
        data: downloaded[i],
        contentType: entry.contentType,
      }
      return acc
    }, {} as Record<string, DirectoryEntry>)
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
    const downloadedDir = entries.reduce((acc, entry, i) => {
      acc[entry.path] = {
        data: downloaded[i],
        contentType: entry.contentType,
      }
      return acc
    }, {} as Record<string, DirectoryEntry>)
    expect(downloadedDir).toEqual({ ...dir, '/': dir[defaultPath] })
  })

  it('downloadDirectory() returns the same data provided to uploadDirectory()', async () => {
    const dir = {
      [`foo-${uploadContent}.txt`]: {
        data: `this is foo-${uploadContent}.txt`,
      },
      [`bar-${uploadContent}.txt`]: {
        data: `this is bar-${uploadContent}.txt`,
      },
    }
    const dirHash = await bzz.uploadDirectory(dir)
    const response = await bzz.downloadDirectory(dirHash)
    const downloadedDir = Object.keys(response).reduce(
      (prev, current) => ({
        ...prev,
        [current]: { data: response[current].data.toString('utf8') },
      }),
      {},
    )
    expect(downloadedDir).toEqual(dir)
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
})
