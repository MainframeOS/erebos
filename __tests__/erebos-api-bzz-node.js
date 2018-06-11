import BaseBzz from '../packages/erebos-api-bzz-base'

describe('BaseBzz', () => {
  const url = 'https://example.com/swarm-gateways'
  const bzz = new BaseBzz(url)
  bzz._fetch = fetch // Injected by extending class

  beforeEach(() => {
    fetch.resetMocks()
  })

  it('uploadRaw() uploads the contents and returns the hash', async () => {
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
    expect(fetchUrl).toBe(`${url}/bzz-raw:`)
    // Check the body is converted to a Buffer when a string is provided
    // Needs to use buffer.equals() to properly check buffer equality
    expect(Buffer.from('hello').equals(body)).toBe(true)
    // Check the request is properly sent as POST
    expect(method).toBe('POST')
    // Check the `content-length` header is set based on the body
    expect(headers['content-length']).toBe(5)
  })
})
