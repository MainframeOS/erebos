/* global Erebos */
/* eslint-env browser */

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
        '../packages/swarm-browser/dist/erebos.development.js',
      ),
    })
    const clientHandle = await page.evaluateHandle(
      () => new Erebos.SwarmClient('http://localhost:8500'),
    )
    page.on('console', msg => {
      for (let i = 0; i < msg.args().length; ++i)
        /* eslint-disable-next-line no-console */
        console.log(`${i}: ${msg.args()[i]}`)
    })
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
          await client.bzz.download('abcdef123456')
        } catch (err) {
          return err.message
        }
      })
      expect(errMessage).toBe('Not Found')
    })

    it('uploads/downloads the file using bzz', async () => {
      const manifestHash = await evalClient(async (client, uploadContent) => {
        return await client.bzz.upload(uploadContent, {
          contentType: 'text/plain',
        })
      }, uploadContent)
      const evalResponse = await evalClient(async (client, manifestHash) => {
        const response = await client.bzz.download(manifestHash)
        return response.text()
      }, manifestHash)
      expect(evalResponse).toBe(uploadContent)
    })

    it('uploads/downloads the file using bzz with content path', async () => {
      const manifestHash = await evalClient(async (client, uploadContent) => {
        return await client.bzz.upload(uploadContent, {
          contentType: 'text/plain',
        })
      }, uploadContent)
      const manifest = await evalClient(async (client, manifestHash) => {
        return await client.bzz.list(manifestHash)
      }, manifestHash)
      const entryHash = manifest.entries[0].hash
      const evalResponse = await evalClient(
        async (client, manifestHash, entryHash) => {
          const response = await client.bzz.download(manifestHash, entryHash)
          return response.text()
        },
        manifestHash,
        entryHash,
      )
      expect(evalResponse).toBe(uploadContent)
    })

    it('uploads/downloads the file using bzz-raw', async () => {
      let evalResponse
      const manifestHash = await evalClient(async (client, uploadContent) => {
        return await client.bzz.upload(uploadContent)
      }, uploadContent)
      evalResponse = await evalClient(async (client, manifestHash) => {
        const response = await client.bzz.download(manifestHash, {
          mode: 'raw',
        })
        return response.text()
      }, manifestHash)
      expect(evalResponse).toBe(uploadContent)
      evalResponse = await evalClient(async (client, manifestHash) => {
        const response = await client.bzz.download(manifestHash, {
          mode: 'raw',
        })
        const responseBlob = await response.blob()
        return await new Promise(resolve => {
          const reader = new FileReader()
          reader.addEventListener('loadend', () => {
            resolve(reader.result)
          })
          reader.readAsText(responseBlob)
        })
      }, manifestHash)
      expect(evalResponse).toBe(uploadContent)
    })
  })
})
