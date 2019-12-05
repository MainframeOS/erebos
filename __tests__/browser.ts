/* global Erebos */
/* eslint-env browser */

import { resolve } from 'path'

import { hexValue } from '@erebos/hex'
import { pubKeyToAddress } from '@erebos/keccak256'
import { createKeyPair, sign } from '@erebos/secp256k1'

describe('browser', () => {
  let evalClient
  let user
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

    await page.addScriptTag({
      path: resolve(
        __dirname,
        '../packages/swarm-browser/dist/readable-stream.js',
      ),
    })

    await page.addScriptTag({
      path: resolve(
        __dirname,
        '../packages/timeline/dist/erebos.timeline.development.js',
      ),
    })

    const keyPair = createKeyPair()
    user = pubKeyToAddress(keyPair.getPublic('array'))

    await page.exposeFunction('signBytes', (bytes: Array<number>) => {
      return sign(bytes, keyPair)
    })

    const clientHandle = await page.evaluateHandle(() => {
      return new Erebos.swarm.SwarmClient({
        bzz: {
          signBytes: window.signBytes,
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

  describe('api-bzz-browser', () => {
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

    it('uploads/downloads the file with bzz using streams', async () => {
      const manifestHash = await evalClient(async (client, uploadContent) => {
        const s = new NodeStream.Readable()
        s.push(uploadContent)
        s.push(null)

        return await client.bzz.upload(s, {
          contentType: 'text/plain',
        })
      }, uploadContent)

      const evalResponse = await evalClient(async (client, manifestHash) => {
        const response = await client.bzz.downloadStream(manifestHash)
        return new Promise(resolve => {
          const data: Array<Uint8Array> = []

          response.on('data', (d: Uint8Array) => {
            data.push(d)
          })

          response.on('end', () => {
            resolve(data)
          })
        })
      }, manifestHash)

      // Reconstruct Buffer
      const decodedResponse = evalResponse.map(b =>
        Buffer.from(Object.values(b)),
      )
      expect(Buffer.concat(decodedResponse).toString()).toBe(uploadContent)
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

    it('downloadDirectoryData() streams the same data provided to uploadDirectory()', async () => {
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
        const response = await client.bzz.downloadDirectoryData(dirHash)
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

    it('supports feeds posting and getting', async () => {
      jest.setTimeout(20000)
      const data = { test: uploadContent }
      const value = await evalClient(
        async (client, user, data) => {
          const params = { user, name: data.uploadContent }
          await client.bzz.setFeedChunk(params, data)
          const res = await client.bzz.getFeedChunk(params)
          return await res.json()
        },
        user,
        data,
      )
      expect(value).toEqual(data)
    })

    it('creates a feed manifest', async () => {
      const hash = await evalClient(async (client, user) => {
        return await client.bzz.createFeedManifest({
          user,
          name: 'manifest',
        })
      }, user)
      expect(hash).toBeDefined()
    })

    it('uploads data and updates the feed chunk', async () => {
      jest.setTimeout(20000)
      const value = await evalClient(
        async (client, user, name) => {
          const manifestHash = await client.bzz.createFeedManifest({
            user,
            name,
          })
          await client.bzz.setFeedContent(manifestHash, 'hello', {
            contentType: 'text/plain',
          })
          const res = await client.bzz.download(manifestHash)
          return await res.text()
        },
        user,
        uploadContent,
      )
      expect(value).toBe('hello')
    })

    it('getFeedContentHash() returns the feed content hash', async () => {
      jest.setTimeout(20000)

      const uploadedHash = await evalClient(
        async (client, user, name) => {
          return await client.bzz.setFeedContent({ user, name }, 'hello', {
            contentType: 'text/plain',
          })
        },
        user,
        uploadContent,
      )

      const contentHash = await evalClient(
        async (client, user, name) => {
          return await client.bzz.getFeedContentHash({ user, name })
        },
        user,
        uploadContent,
      )
      expect(contentHash).toBe(uploadedHash)
    })

    it('getFeedContent() returns the feed content', async () => {
      jest.setTimeout(20000)

      await evalClient(
        async (client, user, name) => {
          return await client.bzz.setFeedContent({ user, name }, 'hello', {
            contentType: 'text/plain',
          })
        },
        user,
        uploadContent,
      )

      const value = await evalClient(
        async (client, user, name) => {
          const res = await client.bzz.getFeedContent({ user, name })
          return await res.text()
        },
        user,
        uploadContent,
      )
      expect(value).toBe('hello')
    })

    it('supports feed chunk polling', async () => {
      jest.setTimeout(60000)

      await evalClient(
        async (client, user, name) => {
          const sleep = async (): Promise<void> => {
            await new Promise(resolve => {
              setTimeout(resolve, 5000)
            })
          }

          const params = { user, name }
          let step = '0-idle'
          let expectedValue

          let completeTest
          const testPromise = new Promise(resolve => {
            completeTest = resolve
          })

          const subscription = client.bzz
            .pollFeedChunk(params, { interval: 2000 })
            .subscribe(async res => {
              /* eslint-disable require-atomic-updates */
              if (res === null) {
                if (step === '0-idle') {
                  step = '1-first-value-post'
                  await client.bzz.setFeedChunk(params, 'hello')
                  expectedValue = 'hello'
                  step = '2-first-value-posted'
                }
              } else {
                const value = await res.text()
                if (step === '2-first-value-posted') {
                  if (value !== expectedValue) {
                    throw new Error(
                      `Invalid value: ${value}, expected: ${expectedValue}`,
                    )
                  }
                  step = '3-first-value-received'
                  await sleep()
                  step = '4-second-value-post'
                  await client.bzz.setFeedChunk(params, 'world')
                  expectedValue = 'world'
                  step = '5-second-value-posted'
                } else if (step === '5-second-value-posted') {
                  if (value !== expectedValue) {
                    throw new Error(
                      `Invalid value: ${value}, expected: ${expectedValue}`,
                    )
                  }
                  subscription.unsubscribe()
                  step = '6-unsubscribed'
                  await sleep()
                  completeTest()
                } else if (step === '6-unsubscribed') {
                  throw new Error('Event received after unsubscribed')
                }
              }
              /* eslint-enable require-atomic-updates */
            })

          await testPromise
        },
        user,
        uploadContent,
      )
    })

    it('supports feed content hash polling', async () => {
      jest.setTimeout(60000)

      await evalClient(
        async (client, user, name) => {
          const sleep = async (): Promise<void> => {
            await new Promise(resolve => {
              setTimeout(resolve, 8000)
            })
          }

          const params = { user, name }
          const post = async (value): Promise<hexValue> => {
            return await client.bzz.setFeedContent(params, value, {
              contentType: 'text/plain',
            })
          }

          let step = '0-idle'
          let expectedHash
          let previousValue

          let completeTest
          const testPromise = new Promise(resolve => {
            completeTest = resolve
          })

          const subscription = client.bzz
            .pollFeedContentHash(params, {
              interval: 5000,
              changedOnly: true,
            })
            .subscribe(async value => {
              /* eslint-disable require-atomic-updates */
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
              /* eslint-enable require-atomic-updates */
            })

          await testPromise
        },
        user,
        uploadContent,
      )
    })

    it('supports feed content polling', async () => {
      jest.setTimeout(60000)

      await evalClient(
        async (client, user, name) => {
          const sleep = async (): Promise<void> => {
            await new Promise(resolve => {
              setTimeout(resolve, 8000)
            })
          }

          const params = { user, name }
          const post = async (value): Promise<hexValue> => {
            return await client.bzz.setFeedContent(params, value, {
              contentType: 'text/plain',
            })
          }

          let step = '0-idle'
          let expectedValue

          let completeTest
          const testPromise = new Promise(resolve => {
            completeTest = resolve
          })

          const subscription = client.bzz
            .pollFeedContent(params, {
              interval: 5000,
              mode: 'content-response',
              changedOnly: true,
            })
            .subscribe(async res => {
              /* eslint-disable require-atomic-updates */
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
              /* eslint-enable require-atomic-updates */
            })

          await testPromise
        },
        user,
        uploadContent,
      )
    })

    it('feed polling fails on not found error if the option is enabled', async () => {
      await evalClient(async (client, user) => {
        await new Promise((resolve, reject) => {
          client.bzz
            .pollFeedChunk(
              { user, name: 'notfound' },
              { whenEmpty: 'error', immediate: false },
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

  describe('timeline', () => {
    it('exports the PROTOCOL, VERSION and VERSION_RANGE constants', async () => {
      const protocol = await page.evaluate(() => {
        return Erebos.timeline.PROTOCOL
      })
      expect(protocol).toBe('timeline')

      const version = await page.evaluate(() => {
        return Erebos.timeline.VERSION
      })
      expect(version).toBe('1.0.0')

      const versionRange = await page.evaluate(() => {
        return Erebos.timeline.VERSION_RANGE
      })
      expect(versionRange).toBe('^1.0.0')
    })

    it('provides a createChapter() function', async () => {
      const timestamp = Date.now()
      const chapter = await page.evaluate(
        (author, timestamp) => {
          return Erebos.timeline.createChapter({
            author,
            timestamp,
            type: 'text/plain',
            content: 'hello',
          })
        },
        user,
        timestamp,
      )
      expect(chapter).toEqual({
        protocol: 'timeline',
        version: '1.0.0',
        timestamp,
        type: 'text/plain',
        author: user,
        content: 'hello',
      })
    })

    it('provides a validateChapter() function', async () => {
      const invalidPayload = await page.evaluate(() => {
        try {
          Erebos.timeline.validateChapter({})
        } catch (err) {
          return err.message
        }
      })
      expect(invalidPayload).toBe('Invalid payload')

      const unsupportedProtocol = await page.evaluate(() => {
        try {
          Erebos.timeline.validateChapter({
            protocol: 'test',
            version: '1.0.0',
          })
        } catch (err) {
          return err.message
        }
      })
      expect(unsupportedProtocol).toBe('Unsupported protocol')

      const unsupportedVersion1 = await page.evaluate(() => {
        try {
          Erebos.timeline.validateChapter({
            protocol: 'timeline',
            version: 0,
          })
        } catch (err) {
          return err.message
        }
      })
      expect(unsupportedVersion1).toBe('Unsupported protocol version')

      const unsupportedVersion2 = await page.evaluate(() => {
        try {
          Erebos.timeline.validateChapter({
            protocol: 'timeline',
            version: '2.0.0',
          })
        } catch (err) {
          return err.message
        }
      })
      expect(unsupportedVersion2).toBe('Unsupported protocol version')

      const valid = { protocol: 'timeline', version: '1.0.0' }
      const validated = await page.evaluate(chapter => {
        return Erebos.timeline.validateChapter(chapter)
      }, valid)
      expect(validated).toEqual(valid)
    })

    it('getChapter() method downloads and decodes the chapter', async () => {
      const timestamp = Date.now()

      const [validID, invalidID] = await evalClient(
        async (client, author, timestamp) => {
          const chapter = Erebos.timeline.createChapter({
            author,
            timestamp,
            content: { ok: true },
          })
          return await Promise.all([
            client.bzz.uploadFile(JSON.stringify(chapter)),
            client.bzz.uploadFile(JSON.stringify({ ok: false })),
          ])
        },
        user,
        timestamp,
      )

      const valid = await evalClient(async (client, id) => {
        const timeline = new Erebos.timeline.Timeline({ bzz: client.bzz })
        return await timeline.getChapter(id)
      }, validID)
      expect(valid).toEqual({
        id: validID,
        protocol: 'timeline',
        version: '1.0.0',
        timestamp,
        type: 'application/json',
        author: user,
        content: { ok: true },
      })

      const invalidError = await evalClient(async (client, id) => {
        const timeline = new Erebos.timeline.Timeline({ bzz: client.bzz })
        try {
          await timeline.getChapter(id)
        } catch (err) {
          return err.message
        }
      }, invalidID)
      expect(invalidError).toBe('Invalid payload')
    })

    it('postChapter() method encodes and uploads the chapter', async () => {
      const chapter = await page.evaluate(author => {
        return Erebos.timeline.createChapter({ author, content: { ok: true } })
      }, user)
      const [id, downloaded] = await evalClient(async (client, chapter) => {
        const timeline = new Erebos.timeline.Timeline({ bzz: client.bzz })
        const id = await timeline.postChapter(chapter)
        const downloaded = await timeline.getChapter(id)
        return [id, downloaded]
      }, chapter)
      expect(downloaded).toEqual({ ...chapter, id })
    })

    it('setLatestChapterID() and getLatestChapterID() methods manipulate a feed hash', async () => {
      jest.setTimeout(10000) // 10 secs
      const chapter = await page.evaluate(author => {
        return Erebos.timeline.createChapter({ author, content: { ok: true } })
      }, user)
      const [chapterID, loadedID] = await evalClient(
        async (client, feed, chapter) => {
          const timeline = new Erebos.timeline.Timeline({
            bzz: client.bzz,
            feed,
          })
          const chapterID = await timeline.postChapter(chapter)
          await timeline.setLatestChapterID(chapterID)
          const loadedID = await timeline.getLatestChapterID()
          return [chapterID, loadedID]
        },
        { user, name: uploadContent },
        chapter,
      )
      expect(loadedID).toBe(chapterID)
    })

    it('setLatestChapter() and getLatestChapter() methods manipulate a chapter', async () => {
      jest.setTimeout(10000) // 10 secs
      const chapter = await page.evaluate(author => {
        return Erebos.timeline.createChapter({ author, content: { ok: true } })
      }, user)
      const [chapterID, loadedChapter] = await evalClient(
        async (client, feed, chapter) => {
          const timeline = new Erebos.timeline.Timeline({
            bzz: client.bzz,
            feed,
          })
          const chapterID = await timeline.setLatestChapter(chapter)
          const loadedChapter = await timeline.getLatestChapter()
          return [chapterID, loadedChapter]
        },
        { user, name: uploadContent },
        chapter,
      )
      expect(loadedChapter).toEqual({ ...chapter, id: chapterID })
    })
  })
})
