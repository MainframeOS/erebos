/* global Erebos */
/* eslint-env browser */

import { resolve } from 'path'

describe('swarm-browser', () => {
  let evalClient
  let uploadContent

  beforeAll(async () => {
    page.on('console', msg => {
      for (let i = 0; i < msg.args().length; ++i) {
        /* eslint-disable-next-line no-console */
        console.log(msg.args()[i])
      }
    })

    page.on('pageerror', function(err) {
      /* eslint-disable-next-line no-console */
      console.log('Page error: ' + err.toString())
    })

    page.on('error', function(err) {
      /* eslint-disable-next-line no-console */
      console.log('Error: ' + err.toString())
    })

    await page.addScriptTag({
      path: resolve(
        __dirname,
        '../packages/swarm-browser/dist/erebos.swarm.development.js',
      ),
    })

    const clientHandle = await page.evaluateHandle(() => {
      return new Erebos.swarm.SwarmClient({
        bzz: {
          url: 'http://localhost:8500',
        },
      })
    })

    evalClient = (exec, ...args) => {
      return page.evaluate(exec, clientHandle, ...args)
    }
  })

  beforeEach(() => {
    uploadContent = Math.random()
      .toString(36)
      .slice(2)
  })

  describe('Bzz API', () => {
    it('trying to download non-existent hash raises an error', async () => {
      const errMessage = await evalClient(async client => {
        try {
          await client.bzz.download('abcdef123456')
        } catch (err) {
          return err.status
        }
      })
      expect(errMessage).toBe(404)
    })

    it('uploads/downloads the file using bzz', async () => {
      const manifestHash = await evalClient(async (client, uploadContent) => {
        return await client.bzz.uploadFile(uploadContent, {
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
        return await client.bzz.uploadFile(uploadContent, {
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
        return await client.bzz.uploadFile(uploadContent)
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

    it('downloads the file with bzz using streams', async () => {
      const manifestHash = await evalClient(async (client, uploadContent) => {
        return await client.bzz.uploadFile(uploadContent, {
          contentType: 'text/plain',
        })
      }, uploadContent)

      const bytes = await evalClient(async (client, manifestHash) => {
        const res = await client.bzz.download(manifestHash)
        const reader = res.body.getReader()

        let bytes: Array<number> = []
        let chunk = await reader.read()
        while (!chunk.done) {
          bytes = bytes.concat(Array.from(chunk.value))
          chunk = await reader.read()
        }

        return bytes
      }, manifestHash)

      expect(Buffer.from(bytes).toString()).toBe(uploadContent)
    })

    it('lists common prefixes for nested directories', async () => {
      const expectedCommonPrefixes = ['dir1/', 'dir2/']
      const dirs = {
        [`dir1/foo-${uploadContent}.txt`]: {
          data: `this is foo-${uploadContent}.txt`,
          contentType: 'plain/text',
        },
        [`dir2/bar-${uploadContent}.txt`]: {
          data: `this is bar-${uploadContent}.txt`,
          contentType: 'plain/text',
        },
      }
      const commonPrefixes = await evalClient(async (client, dirs) => {
        const dirHash = await client.bzz.uploadDirectory(dirs)
        const manifest = await client.bzz.list(dirHash)
        return manifest.common_prefixes
      }, dirs)
      expect(commonPrefixes).toEqual(expectedCommonPrefixes)
    })

    it('lists files in a directory', async () => {
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
      const directoryList = await evalClient(async (client, dir) => {
        const dirHash = await client.bzz.uploadDirectory(dir)
        const manifest = await client.bzz.list(dirHash)
        const entries = Object.values(manifest.entries)
        const downloaded = await Promise.all(
          entries.map(async entry => {
            const r = await client.bzz.download(entry.hash, { mode: 'raw' })
            return await r.text()
          }),
        )
        const downloadedDir = entries.reduce((acc, entry, i) => {
          acc[entry.path] = {
            data: downloaded[i],
            contentType: entry.contentType,
          }
          return acc
        }, {})
        return downloadedDir
      }, dir)

      expect(directoryList).toEqual(dir)
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
      const directoryList = await evalClient(
        async (client, dir, options) => {
          const dirHash = await client.bzz.uploadDirectory(dir, options)
          const manifest = await client.bzz.list(dirHash)
          const entries = Object.values(manifest.entries)
          const downloaded = await Promise.all(
            entries.map(async entry => {
              const r = await client.bzz.download(entry.hash, { mode: 'raw' })
              return await r.text()
            }),
          )
          const downloadedDir = entries.reduce((acc, entry, i) => {
            acc[entry.path] = {
              data: downloaded[i],
              contentType: entry.contentType,
            }
            return acc
          }, {})
          return downloadedDir
        },
        dir,
        { defaultPath },
      )

      expect(directoryList).toEqual({ ...dir, '/': dir[defaultPath] })
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

      const downloadedDir = await evalClient(async (client, dir) => {
        const dirHash = await client.bzz.uploadDirectory(dir)
        const response = await client.bzz.downloadDirectory(dirHash)
        return Object.keys(response).reduce(
          (prev, current) => ({
            ...prev,
            [current]: { data: response[current].data.toString('utf8') },
          }),
          {},
        )
      }, dir)

      expect(downloadedDir).toEqual(dir)
    })
  })
})
