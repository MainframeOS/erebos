/**
 * @jest-environment jsdom
 */

import Bzz from '../packages/erebos-api-bzz-browser'

describe('bzz-browser', () => {
  const url = 'http://localhost:8500/'
  const bzz = new Bzz(url)

  it('uploadDirectory() uploads the contents and returns the hash of the manifest', async () => {
    const dir = {
      'foo.txt': { data: 'this is foo.txt' },
      'bar.txt': { data: 'this is bar.txt' },
    }
    const uploadRequest = bzz.uploadDirectory(dir)
    expect(uploadRequest).rejects.toThrow('Not Implemented')
  })
})
