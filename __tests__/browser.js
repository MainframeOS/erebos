/* global Erebos */

import { resolve } from 'path'

describe('browser', () => {
  let evalClient
  let uploadContent

  beforeEach(() => {
    uploadContent = Math.random()
      .toString(36)
      .slice(2)
  })

  beforeAll(async () => {
    await page.addScriptTag({
      path: resolve(
        __dirname,
        '../packages/browser/dist/erebos.development.js',
      ),
    })
    const clientHandle = await page.evaluateHandle(
      () => new Erebos.Client({ http: 'http://localhost:8500' }),
    )
    page.on('console', msg => {
      for (let i = 0; i < msg.args().length; ++i)
        console.log(`${i}: ${msg.args()[i]}`);
    });
    evalClient = (exec, ...args) => page.evaluate(exec, clientHandle, ...args)
  })

  describe('bzz', () => {
    it('upload() called with Object as an argument calls uploadDirectory()', async () => {
      const errMessage = await evalClient(async client => {
        try {
          await client.bzz.upload({})
        } catch (err) {
          return err.message
        }
      })
      expect(errMessage).toBe('Not Implemented')
    })

    it('uploadDirectory() is not implemented for the browser yet', async () => {
      const errMessage = await evalClient(async client => {
        try {
          await client.bzz.uploadDirectory({})
        } catch (err) {
          return err.message
        }
      })
      expect(errMessage).toBe('Not Implemented')
    })

    it('trying to download non-existent hash raises an error', async () => {
      const errMessage = await evalClient(async client => {
        try {
          await client.bzz.downloadRawBlob('abcdef123456')
        } catch (err) {
          return err.message
        }
      })
      expect(errMessage).toBe('Not Found')
    })

    it('trying to upload without specifying content-type fails', async () => {
      const errMessage = await evalClient(async (client, uploadContent) => {
        try {
          await client.bzz.upload(uploadContent, {})
        } catch (err) {
          return err.message
        }
      }, uploadContent)
      expect(errMessage).toBe('Bad Request')
    })

    it('uploads/downloads the file using bzz', async () => {
      let evalResponse
      const manifestHash = await evalClient(async (client, uploadContent) => {
        const headers = { 'Content-Type': 'text/plain' }
        return await client.bzz.upload(uploadContent, headers)
      }, uploadContent)
      evalResponse = await evalClient(async (client, manifestHash) => {
        const response = await client.bzz.download(manifestHash)
        return response.text()
      }, manifestHash)
      expect(await evalResponse).toBe(uploadContent)
      evalResponse = await evalClient(async (client, manifestHash) => {
        return await client.bzz.downloadText(manifestHash)
      }, manifestHash)
      expect(await evalResponse).toBe(uploadContent)
    })

    it('uploads/downloads the file using bzz with content path', async () => {
      let evalResponse
      const manifestHash = await evalClient(async (client, uploadContent) => {
        const headers = { 'Content-Type': 'text/plain' }
        return await client.bzz.upload(uploadContent, headers)
      }, uploadContent)
      const manifest = await evalClient(async (client, manifestHash) => {
        return await client.bzz.downloadRawText(manifestHash)
      }, manifestHash)
      const entryHash = JSON.parse(manifest).entries[0].hash
      evalResponse = await evalClient(
        async (client, manifestHash, entryHash) => {
          const response = await client.bzz.download(manifestHash, entryHash)
          return response.text()
        },
        manifestHash,
        entryHash,
      )
      expect(await evalResponse).toBe(uploadContent)
      evalResponse = await evalClient(async (client, manifestHash) => {
        const response = await client.bzz.downloadText(manifestHash)
        return response
      }, manifestHash)
      expect(await evalResponse).toBe(uploadContent)
    })

    it('uploads/downloads the file using bzz-raw', async () => {
      let evalResponse
      const manifestHash = await evalClient(async (client, uploadContent) => {
        return await client.bzz.uploadRaw(uploadContent)
      }, uploadContent)
      evalResponse = await evalClient(async (client, manifestHash) => {
        const response = await client.bzz.downloadRaw(manifestHash)
        return response.text()
      }, manifestHash)
      expect(await evalResponse).toBe(uploadContent)
      evalResponse = await evalClient(async (client, manifestHash) => {
        return await client.bzz.downloadRawText(manifestHash)
      }, manifestHash)
      expect(await evalResponse).toBe(uploadContent)
      evalResponse = await evalClient(async (client, manifestHash) => {
        const response = await client.bzz.downloadRawBlob(manifestHash)
        const getBlobText = blob => {
          return new Promise(resolve => {
            const reader = new FileReader()
            reader.addEventListener('loadend', () => {
              resolve(reader.result)
            })
            reader.readAsText(blob)
          })
        }
        return await getBlobText(response)
      }, manifestHash)
      expect(await evalResponse).toBe(uploadContent)
    })
  })
})
