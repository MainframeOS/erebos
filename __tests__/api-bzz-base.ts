/* global fetch */

import { randomBytes } from 'crypto'
import {
  FEED_ZERO_TOPIC,
  BaseBzz,
  FeedID,
  HTTPError,
  feedMetaToHash,
  getFeedTopic,
  getModeProtocol,
  isDirectoryData,
  resOrError,
  resJSON,
  resText,
} from '@erebos/api-bzz-base'
import { Hex, hexValue } from '@erebos/hex'
import { Readable } from 'readable-stream'

describe('api-bzz-base', () => {
  const TEST_URL = 'https://example.com/swarm-gateways/'
  const bzz = new BaseBzz(fetch, { url: TEST_URL })

  beforeEach(() => {
    fetch.resetMocks()
  })

  it('isDirectoryData should correctly identify structures ', function() {
    const data: Array<Array<any>> = [
      [1, false],
      [undefined, false],
      [null, false],
      [[], false],
      [new Date(), false],
      [{ some: 'object' }, false],
      ['', false],
      ['data', false],
      [Buffer.from('data'), false],
      [new Readable(), false],
      [{ 'some/path': { data: '' } }, true],
      [{}, true],
    ]

    data.forEach(([input, result]) =>
      expect(isDirectoryData(input)).toEqual(result),
    )
  })

  it('exports getModeProtocol() utility function', () => {
    expect(getModeProtocol('default')).toBe('bzz:/')
    expect(getModeProtocol('immutable')).toBe('bzz-immutable:/')
    expect(getModeProtocol('raw')).toBe('bzz-raw:/')
    // Default to `bzz:/` when not provided or existing
    expect(getModeProtocol()).toBe('bzz:/')
    expect(getModeProtocol('test')).toBe('bzz:/')
  })

  it('exports HTTPError class extending Error', () => {
    const error = new HTTPError(404, 'Not found')
    expect(error instanceof Error).toBe(true)
    expect(error.message).toBe('Not found')
    expect(error.status).toBe(404)
  })

  it('exports resOrError() utility function', async () => {
    const resOK = { ok: true }
    expect(await resOrError(resOK)).toBe(resOK)

    try {
      await resOrError({
        ok: false,
        status: 400,
        text: (): Promise<string> =>
          Promise.resolve('Message: Some error message'),
        statusText: 'Bad request',
      })
    } catch (error) {
      expect(error instanceof HTTPError).toBe(true)
      expect(error.status).toBe(400)
      expect(error.message).toBe('Some error message')
    }
  })

  it('exports resJSON() utility function', async () => {
    const data = await resJSON({
      ok: true,
      json: () => Promise.resolve({ test: true }),
    })
    expect(data).toEqual({ test: true })

    try {
      await resJSON({
        ok: false,
        status: 400,
        text: (): Promise<string> =>
          Promise.resolve('Message: Some error message'),
        statusText: 'Bad request',
      })
    } catch (error) {
      expect(error instanceof HTTPError).toBe(true)
      expect(error.status).toBe(400)
      expect(error.message).toBe('Some error message')
    }
  })

  it('exports resText() utility function', async () => {
    const data = await resText({
      ok: true,
      text: () => Promise.resolve('OK'),
    })
    expect(data).toBe('OK')

    try {
      await resText({
        ok: false,
        status: 400,
        text: (): Promise<string> =>
          Promise.resolve('Message: Some error message'),
        statusText: 'Bad request',
      })
    } catch (error) {
      expect(error instanceof HTTPError).toBe(true)
      expect(error.status).toBe(400)
      expect(error.message).toBe('Some error message')
    }
  })

  describe('Bzz class', () => {
    jest.useFakeTimers()

    it('fetchTimeout() method supports timeout options', async () => {
      const bzzTimeout = new BaseBzz(fetch, { url: TEST_URL, timeout: 5000 })

      // Default (instance) timeout
      fetch.mockResponseOnce('ok')
      await bzzTimeout.fetchTimeout('test', {})
      expect(setTimeout).toHaveBeenCalledTimes(1)
      expect(setTimeout.mock.calls[0][1]).toBe(5000)

      // Set in options
      fetch.mockResponseOnce('ok')
      await bzzTimeout.fetchTimeout('test', { timeout: 2000 })
      expect(setTimeout).toHaveBeenCalledTimes(2)
      expect(setTimeout.mock.calls[1][1]).toBe(2000)

      // No timeout (set to 0)
      fetch.mockResponseOnce('ok')
      await bzzTimeout.fetchTimeout('test', { timeout: 0 })
      expect(setTimeout).toHaveBeenCalledTimes(2)

      // Rejects with timeout error
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      fetch.mockResponseOnce(() => new Promise(() => {})) // Never resolves
      const req = bzzTimeout.fetchTimeout('test', {})
      expect(setTimeout).toHaveBeenCalledTimes(3)
      jest.runAllTimers()
      await expect(req).rejects.toThrow('Timeout')
    })

    it('getDownloadURL() creates the request URL for downloads', () => {
      // Default behavior
      expect(bzz.getDownloadURL('test', {})).toBe(`${TEST_URL}bzz:/test/`)
      // Force raw
      expect(bzz.getDownloadURL('test', {}, true)).toBe(
        `${TEST_URL}bzz-raw:/test/`,
      )
      // Handle `mode` option
      expect(bzz.getDownloadURL('test', { mode: 'immutable' })).toBe(
        `${TEST_URL}bzz-immutable:/test/`,
      )
      expect(bzz.getDownloadURL('test', { mode: 'raw' })).toBe(
        `${TEST_URL}bzz-raw:/test/`,
      )
      // Handle `path` option
      expect(bzz.getDownloadURL('test', { path: 'hello' })).toBe(
        `${TEST_URL}bzz:/test/hello`,
      )
      // Handle `contentType` option
      expect(
        bzz.getDownloadURL('test', { mode: 'raw', contentType: 'text/plain' }),
      ).toBe(`${TEST_URL}bzz-raw:/test/?content_type=text/plain`)
      // Only set content type in raw mode
      expect(bzz.getDownloadURL('test', { contentType: 'text/plain' })).toBe(
        `${TEST_URL}bzz:/test/`,
      )
    })

    it('getUploadURL() creates the request URL for uploads', () => {
      // Default behavior
      expect(bzz.getUploadURL({})).toBe(`${TEST_URL}bzz:/`)
      // Force raw
      expect(bzz.getUploadURL({}, true)).toBe(`${TEST_URL}bzz-raw:/`)
      // Handle `manifestHash` option
      expect(bzz.getUploadURL({ manifestHash: '1234' })).toBe(
        `${TEST_URL}bzz:/1234/`,
      )
      // Handle `path` option
      expect(bzz.getUploadURL({ manifestHash: '1234', path: 'test' })).toBe(
        `${TEST_URL}bzz:/1234/test`,
      )
      // `path` option is ignored if `manifestHash` is not provided
      expect(bzz.getUploadURL({ path: 'test' })).toBe(`${TEST_URL}bzz:/`)
      // Support `defaultPath` option
      expect(bzz.getUploadURL({ defaultPath: 'index.html' })).toBe(
        `${TEST_URL}bzz:/?defaultpath=index.html`,
      )
    })

    it('hash() returns the correct hash for a given URL', async () => {
      const expectedHash =
        '7a90587bfc04ac4c64aeb1a96bc84f053d3d84cefc79012c9a07dd5230dc1fa4'
      fetch.mockResponseOnce(expectedHash)
      const bzzUrl = 'theswarm.test'
      const response = await bzz.hash(bzzUrl)
      expect(response).toBe(expectedHash)
      expect(fetch.mock.calls).toHaveLength(1)
      const [fetchUrl] = fetch.mock.calls[0]
      expect(fetchUrl).toBe(`${TEST_URL}bzz-hash:/${bzzUrl}`)
    })

    it('list() returns the metadata for a given manifest and path', async () => {
      const expectedData = { entries: [] }
      const mockData = JSON.stringify(expectedData)

      fetch.mockResponseOnce(mockData)
      const res = await bzz.list('test')
      expect(res).toEqual(expectedData)
      expect(fetch.mock.calls).toHaveLength(1)
      expect(fetch.mock.calls[0][0]).toBe(`${TEST_URL}bzz-list:/test/`)

      fetch.mockResponseOnce(mockData)
      const resPath = await bzz.list('test', { path: 'a' })
      expect(resPath).toEqual(expectedData)
      expect(fetch.mock.calls).toHaveLength(2)
      expect(fetch.mock.calls[1][0]).toBe(`${TEST_URL}bzz-list:/test/a`)
    })

    it('download() performs the request based on the given parameters and returns the response or error', async () => {
      fetch.mockResponseOnce('OK')
      const res = await bzz.download('test', {
        headers: { accept: 'application/json' },
        mode: 'raw',
      })
      expect(Buffer.from(res.body).toString()).toBe('OK')
      const [fetchUrl, { headers }] = fetch.mock.calls[0]
      expect(fetchUrl).toBe(`${TEST_URL}bzz-raw:/test/`)
      expect(headers).toEqual({ accept: 'application/json' })

      const expectedError = new HTTPError(404, 'Not found')
      fetch.mockRejectOnce(expectedError)
      try {
        await bzz.download('no', {})
      } catch (err) {
        expect(err).toBe(expectedError)
      }
    })

    it('uploadBody() performs the request based on the given parameters and returns the response or error', async () => {
      fetch.mockResponseOnce('5678')
      const hash = await bzz.uploadBody(
        'test',
        { headers: { 'content-length': 4 }, manifestHash: '1234' },
        true,
      )
      expect(hash).toBe('5678')
      const [fetchUrl, { headers }] = fetch.mock.calls[0]
      expect(fetchUrl).toBe(`${TEST_URL}bzz-raw:/1234/`)
      expect(headers).toEqual({ 'content-length': 4 })

      const expectedError = new HTTPError(400, 'Bad request')
      fetch.mockRejectOnce(expectedError)
      try {
        await bzz.uploadBody('test', {})
      } catch (err) {
        expect(err).toBe(expectedError)
      }
    })

    it('uploadFile() uploads a single file provided as string or Buffer', async () => {
      // Upload a string without content type
      fetch.mockResponseOnce('1234')
      const hash1 = await bzz.uploadFile('test')
      expect(hash1).toBe('1234')
      expect(fetch.mock.calls).toHaveLength(1)
      const [fetchUrl1, params1] = fetch.mock.calls[0]
      expect(fetchUrl1).toBe(`${TEST_URL}bzz-raw:/`)
      expect(params1.headers).toEqual({ 'content-length': 4 })

      // Upload a Buffer with content type and size
      fetch.mockResponseOnce('5678')
      const hash2 = await bzz.uploadFile(Buffer.from('hello'), {
        size: 10,
        contentType: 'text/plain',
      })
      expect(hash2).toBe('5678')
      expect(fetch.mock.calls).toHaveLength(2)
      const [fetchUrl2, params2] = fetch.mock.calls[1]
      expect(fetchUrl2).toBe(`${TEST_URL}bzz:/`)
      expect(params2.headers).toEqual({
        'content-length': 10,
        'content-type': 'text/plain',
      })
    })

    it('uploadDirectory() rejects an error it must be implemented in extending class', async () => {
      await expect(bzz.uploadDirectory({})).rejects.toThrow(
        'Must be implemented in extending class',
      )
    })

    it('upload() calls uploadFile() or uploadDirectory() depending on the provided data', async () => {
      // Upload a string without content type
      fetch.mockResponseOnce('1234')
      const hash1 = await bzz.upload('test')
      expect(hash1).toBe('1234')
      expect(fetch.mock.calls).toHaveLength(1)
      const [fetchUrl1, params1] = fetch.mock.calls[0]
      expect(fetchUrl1).toBe(`${TEST_URL}bzz-raw:/`)
      expect(params1.headers).toEqual({ 'content-length': 4 })

      // Upload a Buffer with content type
      fetch.mockResponseOnce('5678')
      const hash2 = await bzz.upload(Buffer.from('hello'), {
        contentType: 'text/plain',
      })
      expect(hash2).toBe('5678')
      expect(fetch.mock.calls).toHaveLength(2)
      const [fetchUrl2, params2] = fetch.mock.calls[1]
      expect(fetchUrl2).toBe(`${TEST_URL}bzz:/`)
      expect(params2.headers).toEqual({
        'content-length': 5,
        'content-type': 'text/plain',
      })

      // Upload a directory
      await expect(bzz.upload({})).rejects.toThrow(
        'Must be implemented in extending class',
      )
    })

    it('deleteResource() deletes the file in the given manifest and path and returns the new manifest hash', async () => {
      fetch.mockResponseOnce('5678')
      const hash = await bzz.deleteResource('1234', 'test')
      expect(hash).toBe('5678')
      expect(fetch.mock.calls).toHaveLength(1)
      const [fetchUrl, { method }] = fetch.mock.calls[0]
      expect(fetchUrl).toBe(`${TEST_URL}bzz:/1234/test`)
      expect(method).toBe('DELETE')
    })

    it('uploadData() and downloadData() handle JSON data', async () => {
      fetch.mockResponseOnce('1234')
      const data = { hello: 'world' }
      const hash = await bzz.uploadData(data)
      expect(hash).toBe('1234')
      expect(fetch.mock.calls).toHaveLength(1)
      const [fetchUrl1, params1] = fetch.mock.calls[0]
      expect(fetchUrl1).toBe(`${TEST_URL}bzz-raw:/`)
      expect(params1.headers).toEqual({ 'content-length': 17 })

      fetch.mockResponseOnce(JSON.stringify(data))
      const loaded = await bzz.downloadData(hash)
      expect(loaded).toEqual(data)
      expect(fetch.mock.calls).toHaveLength(2)
      expect(fetch.mock.calls[1][0]).toBe(`${TEST_URL}bzz-raw:/1234/`)
    })
  })

  describe('FeedID class', () => {
    function randomHex(size: number): hexValue {
      return Hex.from(randomBytes(size)).value
    }

    it('handles feed params input', () => {
      const user = randomHex(20)
      const topic = randomHex(32)

      const id1 = new FeedID({ user })
      expect(id1.user).toBe(user)
      expect(id1.topic).toBe(FEED_ZERO_TOPIC)
      expect(id1.time).toBe(0)
      expect(id1.level).toBe(0)
      expect(id1.protocolVersion).toBe(0)

      const id2 = new FeedID({ user, topic, time: 10, level: 1 })
      expect(id2.topic).toBe(topic)
      expect(id2.time).toBe(10)
      expect(id2.level).toBe(1)

      const id3 = new FeedID({ user, topic, name: 'test' })
      expect(id3.topic).toBe(getFeedTopic({ topic, name: 'test' }))
    })

    it('provides a fromMetadata() static method', () => {
      const metadata = {
        feed: {
          user: randomHex(20),
          topic: randomHex(32),
        },
        epoch: {
          time: 10,
          level: 5,
        },
        protocolVersion: 1,
      }
      const id = FeedID.fromMetadata(metadata)
      expect(id.feed).toEqual(metadata.feed)
      expect(id.epoch).toEqual(metadata.epoch)
      expect(id.protocolVersion).toBe(metadata.protocolVersion)
    })

    it('provides a toBuffer() method and fromBuffer() static method', () => {
      const id = new FeedID({
        user: randomHex(20),
        topic: randomHex(32),
        time: 20,
        level: 1,
      })
      const other = FeedID.fromBuffer(id.toBuffer())
      expect(other).not.toBe(id)
      expect(other).toEqual(id)
    })

    it('provides a from() static method', () => {
      const feed = {
        user: randomHex(20),
        topic: randomHex(32),
      }
      const epoch = {
        time: 10,
        level: 5,
      }
      const params = { ...feed, ...epoch }
      const metadata = { feed, epoch, protocolVersion: 0 }

      const id1 = new FeedID(params)
      const id2 = FeedID.from(id1)
      expect(id2).not.toBe(id1)
      expect(id2).toEqual(id1)

      const id3 = FeedID.from(params)
      expect(id3).toEqual(id1)

      const id4 = FeedID.from(metadata)
      expect(id4).toEqual(id1)

      const id5 = FeedID.from(id1.toBuffer())
      expect(id5).toEqual(id1)
    })

    it('has a toHash() method', () => {
      const meta = {
        feed: {
          user: randomHex(20),
          topic: randomHex(32),
        },
        epoch: {
          time: 20,
          level: 1,
        },
        protocolVersion: 0,
      }
      const id = FeedID.from(meta)
      expect(id.toHash()).toBe(feedMetaToHash(meta))
    })

    it('has a clone() method', () => {
      const id = new FeedID({
        user: randomHex(20),
        topic: randomHex(32),
        time: 20,
        level: 1,
      })
      const other = id.clone()
      expect(other).not.toBe(id)
      expect(other).toEqual(id)
    })

    it('has a matches() method', () => {
      const feed = {
        user: randomHex(20),
        topic: randomHex(32),
      }
      const id1 = new FeedID({ ...feed, time: 20, level: 1 })
      expect(id1.matches(feed)).toBe(true)
      const id2 = new FeedID({ ...feed, time: 0, level: 0 })
      expect(id2.matches(id1)).toBe(true)
      const id3 = new FeedID({ ...id1.params, user: randomHex(20) })
      expect(id3.matches(id1)).toBe(false)
    })

    it('has an equals() method', () => {
      const params = {
        user: randomHex(20),
        topic: randomHex(32),
        time: 20,
        level: 1,
      }
      const id = new FeedID(params)
      expect(id.equals(params)).toBe(true)
      const other = id.clone()
      expect(other.equals(id)).toBe(true)
      other.time = 0
      expect(other.equals(id)).toBe(false)
    })

    it('has a toJSON() method', () => {
      const params = {
        user: randomHex(20),
        topic: randomHex(32),
        time: 20,
        level: 1,
      }
      expect(FeedID.from(params).toJSON()).toEqual(params)
    })
  })
})
