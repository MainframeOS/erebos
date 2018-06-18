import Bzz from '../packages/erebos-api-bzz-node'

describe('Bzz', () => {
  let uploadContent
  const url = 'http://localhost:8500/'
  const bzz = new Bzz(url)

  beforeEach(() => {
    uploadContent = Math.random().toString(36).slice(2)
  })

  it('trying to upload without specifying content-type fails', async () => {
    const uploadRequest = bzz.upload(uploadContent)
    expect(uploadRequest).rejects.toThrow('Bad Request')
  })

  it('uploading and downloading single file using bzz', async () => {
    const headers = {'Content-Type': 'text/plain'}
    const manifestHash = await bzz.upload(uploadContent, headers)

    const response = await bzz.download(manifestHash)
    expect(await response.text()).toBe(uploadContent)

    const text = await bzz.downloadText(manifestHash)
    expect(text).toBe(uploadContent)

    const buffer = await bzz.downloadBuffer(manifestHash)
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
    const headers = {'Content-Type': 'text/plain'}
    const manifestHash = await bzz.upload(uploadContent, headers)

    // Requesting manifestHash with bzz-raw directly returns the manifest file
    const manifest = await bzz.downloadRawText(manifestHash)
    const entry = JSON.parse(manifest).entries[0]
    expect(entry.contentType).toBe('text/plain')
    expect(entry.size).toBe(uploadContent.length)
  })
})
