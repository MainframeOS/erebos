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

    it('uploads/downloads the file using bzz-raw', async () => {
      let evalResponse
      const manifestHash = await evalClient(async (client, uploadContent) => {
        return await client.bzz.uploadRaw(uploadContent)
      }, uploadContent)
      evalResponse = await evalClient(async (client, manifestHash) => {
        const response = await client.bzz.downloadRaw(manifestHash)
        console.log(JSON.stringify(response), 'response')
        return response
      }, manifestHash)
      expect(await evalResponse.text()).toBe(uploadContent)
      evalResponse = await evalClient(async (client, manifestHash) => {
        return await client.bzz.downloadText(manifestHash)
      }, manifestHash)
      expect(await evalResponse).toBe(uploadContent)
    })
  })
})
