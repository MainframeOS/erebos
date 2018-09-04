/* global Erebos */

import { resolve } from 'path'

describe('browser', () => {
  let evalClient

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
    evalClient = exec => page.evaluate(exec, clientHandle)
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
  })
})
