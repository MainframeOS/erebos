/* global fetch */

import BaseBzz from '../packages/erebos-api-bzz-base'

describe('bzz-base', () => {
  const url = 'https://example.com/swarm-gateways/'
  const bzz = new BaseBzz(url)
  bzz._fetch = fetch // Injected by extending class

  beforeEach(() => {
    fetch.resetMocks()
  })

  it('uploadRaw() uploads the contents and returns the hash of the file', async () => {
    // Mock the expected response body
    const expectedHash = 'abcdef123456'
    fetch.mockResponseOnce(expectedHash)
    const hash = await bzz.uploadRaw('hello')
    // Function call parses and return the response body
    expect(hash).toBe(expectedHash)
    // Ensure only one call to fetch() has been made
    expect(fetch.mock.calls).toHaveLength(1)
    // Extract arguments provided to the first (and only) fetch() call
    const [fetchUrl, { body, headers, method }] = fetch.mock.calls[0]
    // Check uploadRaw() provides the proper URL
    expect(fetchUrl).toBe(`${url}bzz-raw:/`)
    // Check the body is converted to a Buffer when a string is provided
    // Needs to use buffer.equals() to properly check buffer equality
    expect(Buffer.from('hello').equals(body)).toBe(true)
    // Check the request is properly sent as POST
    expect(method).toBe('POST')
    // Check the `content-length` header is set based on the body
    expect(headers['content-length']).toBe(5)
  })

  it('upload() uploads the contents and returns the hash of the manifest', async () => {
    const expectedHash = 'abcdef123456'
    fetch.mockResponseOnce(expectedHash)
    const hash = await bzz.upload('hello')
    expect(hash).toBe(expectedHash)
    expect(fetch.mock.calls).toHaveLength(1)
    const [fetchUrl, { body, headers, method }] = fetch.mock.calls[0]
    expect(fetchUrl).toBe(`${url}bzz:/`)
    expect(Buffer.from('hello').equals(body)).toBe(true)
    expect(method).toBe('POST')
    expect(headers['content-length']).toBe(5)
  })

  it('downloadRaw() requests the data at hash address and returns the response object', async () => {
    const expectedContent = 'hello'
    fetch.mockResponseOnce(expectedContent)
    const hash = 'abcdef123456'
    const response = await bzz.downloadRaw(hash)

    expect(response.body).toBe(expectedContent)
    expect(fetch.mock.calls).toHaveLength(1)
    const [fetchUrl] = fetch.mock.calls[0]
    expect(fetchUrl).toBe(`${url}bzz-raw:/${hash}`)
  })

  it('downloadRawText() requests the data at hash address and returns the response text', async () => {
    const expectedContent = 'hello'
    fetch.mockResponseOnce(expectedContent)
    const hash = 'abcdef123456'
    const response = await bzz.downloadRawText(hash)

    expect(response).toBe(expectedContent)
    expect(fetch.mock.calls).toHaveLength(1)
    const [fetchUrl] = fetch.mock.calls[0]
    expect(fetchUrl).toBe(`${url}bzz-raw:/${hash}`)
  })

  it('download() requests the data at manifest address and returns the response object', async () => {
    const expectedContent = 'hello'
    fetch.mockResponseOnce(expectedContent)
    const hash = 'abcdef123456'
    const response = await bzz.download(hash)

    expect(response.body).toBe(expectedContent)
    expect(fetch.mock.calls).toHaveLength(1)
    const [fetchUrl] = fetch.mock.calls[0]
    expect(fetchUrl).toBe(`${url}bzz:/${hash}`)
  })

  it('download() allows specifying content hash included in the manifest', async () => {
    const expectedContent = 'hello'
    fetch.mockResponseOnce(expectedContent)
    const manifestHash = 'abcdef123456'
    const contentHash = 'uvwxyz456789'
    const response = await bzz.download(manifestHash, contentHash)

    expect(response.body).toBe(expectedContent)
    expect(fetch.mock.calls).toHaveLength(1)
    const [fetchUrl] = fetch.mock.calls[0]
    expect(fetchUrl).toBe(`${url}bzz:/${manifestHash}/${contentHash}`)
  })

  it('downloadText() requests the data at manifest address and returns the response text', async () => {
    const expectedContent = 'hello'
    fetch.mockResponseOnce(expectedContent)
    const hash = 'abcdef123456'
    const response = await bzz.downloadText(hash)

    expect(response).toBe(expectedContent)
    expect(fetch.mock.calls).toHaveLength(1)
    const [fetchUrl] = fetch.mock.calls[0]
    expect(fetchUrl).toBe(`${url}bzz:/${hash}`)
  })
})
