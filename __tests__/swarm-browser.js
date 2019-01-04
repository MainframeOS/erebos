/* global Erebos */
/* eslint-env browser */

import { resolve } from 'path'

import { pubKeyToAddress } from '../packages/keccak256'
import { createKeyPair, sign } from '../packages/secp256k1'

describe('browser', () => {
  let evalClient
  let feedAddress
  let uploadContent

  beforeAll(async () => {
    page.on('console', msg => {
      for (let i = 0; i < msg.args().length; ++i) {
        /* eslint-disable-next-line no-console */
        console.log(`${i}: ${msg.args()[i]}`)
      }
    })

    await page.addScriptTag({
      path: resolve(
        __dirname,
        '../packages/swarm-browser/dist/erebos.development.js',
      ),
    })

    const keyPair = createKeyPair()
    feedAddress = pubKeyToAddress(
      keyPair
        .getPublic()
        .encode()
        .slice(1),
    )

    await page.exposeFunction('signFeedDigest', digest => {
      return sign(digest, keyPair.getPrivate())
    })

    const clientHandle = await page.evaluateHandle(() => {
      return new Erebos.SwarmClient({
        bzz: {
          signFeedDigest: window.signFeedDigest,
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

  describe('bzz', () => {
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
          entries.map(entry =>
            client.bzz
              .download(entry.hash, { mode: 'raw' })
              .then(r => r.text()),
          ),
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
            entries.map(entry =>
              client.bzz
                .download(entry.hash, { mode: 'raw' })
                .then(r => r.text()),
            ),
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

    it('supports feeds posting and getting', async () => {
      jest.setTimeout(20000)
      const data = { test: uploadContent }
      const value = await evalClient(
        async (client, address, data) => {
          const options = { name: data.uploadContent }
          await client.bzz.updateFeedValue(address, data, options)
          const res = await client.bzz.getFeedValue(address, options)
          return await res.json()
        },
        feedAddress,
        data,
      )
      expect(value).toEqual(data)
    })

    it('creates a feed manifest', async () => {
      const hash = await evalClient(async (client, address) => {
        return await client.bzz.createFeedManifest(address, {
          name: 'manifest',
        })
      }, feedAddress)
      expect(hash).toBeDefined()
    })

    it('uploads data and updates the feed value', async () => {
      jest.setTimeout(20000)
      const value = await evalClient(
        async (client, address, name) => {
          const manifestHash = await client.bzz.createFeedManifest(address, {
            name,
          })
          await client.bzz.uploadFeedValue(manifestHash, 'hello', undefined, {
            contentType: 'text/plain',
          })
          const res = await client.bzz.download(manifestHash)
          return await res.text()
        },
        feedAddress,
        uploadContent,
      )
      expect(value).toBe('hello')
    })

    it('getFeedValue() supports content modes', async () => {
      jest.setTimeout(20000)

      const uploadedHash = await evalClient(
        async (client, address, name) => {
          return await client.bzz.uploadFeedValue(
            address,
            'hello',
            { name },
            { contentType: 'text/plain' },
          )
        },
        feedAddress,
        uploadContent,
      )

      const contentHash = await evalClient(
        async (client, address, name) => {
          return await client.bzz.getFeedValue(
            address,
            { name },
            { mode: 'content-hash' },
          )
        },
        feedAddress,
        uploadContent,
      )
      expect(contentHash).toBe(uploadedHash)

      const value = await evalClient(
        async (client, address, name) => {
          const res = await client.bzz.getFeedValue(
            address,
            { name },
            { mode: 'content-response' },
          )
          return await res.text()
        },
        feedAddress,
        uploadContent,
      )
      expect(value).toBe('hello')
    })

    it('supports feed value polling', async () => {
      jest.setTimeout(60000)

      await evalClient(
        async (client, address, name) => {
          const sleep = async () => {
            await new Promise(resolve => {
              setTimeout(resolve, 5000)
            })
          }

          let step = '0-idle'
          let expectedValue

          let completeTest
          const testPromise = new Promise(resolve => {
            completeTest = resolve
          })

          const subscription = client.bzz
            .pollFeedValue(address, { interval: 2000 }, { name })
            .subscribe(async res => {
              if (res === null) {
                if (step === '0-idle') {
                  step = '1-first-value-post'
                  await client.bzz.updateFeedValue(address, 'hello', { name })
                  expectedValue = 'hello'
                  step = '2-first-value-posted'
                }
              } else {
                const value = await res.text()
                if (step === '2-first-value-posted') {
                  if (value !== expectedValue) {
                    throw new Error('Invalid value')
                  }
                  step = '3-first-value-received'
                  await sleep()
                  step = '4-second-value-post'
                  await client.bzz.updateFeedValue(address, 'world', { name })
                  expectedValue = 'world'
                  step = '5-second-value-posted'
                } else if (step === '5-second-value-posted') {
                  if (value !== expectedValue) {
                    throw new Error('Invalid value')
                  }
                  subscription.unsubscribe()
                  step = '6-unsubscribed'
                  await sleep()
                  completeTest()
                } else if (step === '6-unsubscribed') {
                  throw new Error('Event received after unsubscribed')
                }
              }
            })

          await testPromise
        },
        feedAddress,
        uploadContent,
      )
    })

    it('supports feed value polling in "content-hash" mode', async () => {
      jest.setTimeout(60000)

      await evalClient(
        async (client, address, name) => {
          const sleep = async () => {
            await new Promise(resolve => {
              setTimeout(resolve, 8000)
            })
          }

          const post = async value => {
            return await client.bzz.uploadFeedValue(
              address,
              value,
              { name },
              { contentType: 'text/plain' },
            )
          }

          let step = '0-idle'
          let expectedHash
          let previousValue

          let completeTest
          const testPromise = new Promise(resolve => {
            completeTest = resolve
          })

          const subscription = client.bzz
            .pollFeedValue(
              address,
              {
                interval: 5000,
                mode: 'content-hash',
                contentChangedOnly: true,
              },
              { name },
            )
            .subscribe(async value => {
              if (value === null) {
                if (step === '0-idle') {
                  step = '1-first-value-post'
                  expectedHash = await post('hello')
                  step = '2-first-value-posted'
                }
              } else {
                if (value === previousValue) {
                  throw new Error('Invalid value')
                }
                previousValue = value

                if (step === '2-first-value-posted') {
                  if (value !== expectedHash) {
                    throw new Error('Invalid hash')
                  }
                  step = '3-first-value-received'
                  await sleep()
                  step = '4-second-value-post'
                  expectedHash = await post('world')
                  step = '5-second-value-posted'
                } else if (step === '5-second-value-posted') {
                  if (value !== expectedHash) {
                    throw new Error('Invalid hash')
                  }
                  subscription.unsubscribe()
                  completeTest()
                }
              }
            })

          await testPromise
        },
        feedAddress,
        uploadContent,
      )
    })

    it('supports feed value polling in "content-response" mode', async () => {
      jest.setTimeout(60000)

      await evalClient(
        async (client, address, name) => {
          const sleep = async () => {
            await new Promise(resolve => {
              setTimeout(resolve, 8000)
            })
          }

          const post = async value => {
            return await client.bzz.uploadFeedValue(
              address,
              value,
              { name },
              { contentType: 'text/plain' },
            )
          }

          let step = '0-idle'
          let expectedValue

          let completeTest
          const testPromise = new Promise(resolve => {
            completeTest = resolve
          })

          const subscription = client.bzz
            .pollFeedValue(
              address,
              {
                interval: 5000,
                mode: 'content-response',
                contentChangedOnly: true,
              },
              { name },
            )
            .subscribe(async res => {
              if (res === null) {
                if (step === '0-idle') {
                  step = '1-first-value-post'
                  await post('hello')
                  expectedValue = 'hello'
                  step = '2-first-value-posted'
                }
              } else {
                const value = await res.text()

                if (step === '2-first-value-posted') {
                  if (value !== expectedValue) {
                    throw new Error('Invalid value')
                  }
                  step = '3-first-value-received'
                  await sleep()
                  step = '4-second-value-post'
                  await post('world')
                  expectedValue = 'world'
                  step = '5-second-value-posted'
                } else if (step === '5-second-value-posted') {
                  if (value !== expectedValue) {
                    throw new Error('Invalid value')
                  }
                  subscription.unsubscribe()
                  completeTest()
                }
              }
            })

          await testPromise
        },
        feedAddress,
        uploadContent,
      )
    })

    it('feed polling fails on not found error if the option is enabled', async () => {
      await evalClient(async (client, address) => {
        await new Promise((resolve, reject) => {
          client.bzz
            .pollFeedValue(
              address,
              { whenEmpty: 'error', immediate: false },
              { name: 'notfound' },
            )
            .subscribe({
              next: () => {
                reject(
                  new Error('Subscription should not have emitted a value'),
                )
              },
              error: () => {
                resolve()
              },
            })
        })
      })
    })
  })
})
