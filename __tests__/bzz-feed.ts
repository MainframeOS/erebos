import { Subject } from 'rxjs'

import { BzzFeed, FEED_ZERO_TOPIC } from '@erebos/bzz-feed'
import { BzzNode } from '@erebos/bzz-node'
import { pubKeyToAddress } from '@erebos/keccak256'
import { createKeyPair, sign } from '@erebos/secp256k1'

describe('bzz-feed', () => {
  const sleep = async (time = 1000): Promise<void> => {
    await new Promise(resolve => {
      setTimeout(resolve, time)
    })
  }

  const keyPair = createKeyPair()
  const user = pubKeyToAddress(keyPair.getPublic('array'))

  const bzz = new BzzNode({ url: 'http://localhost:8500' })
  const bzzFeed = new BzzFeed({
    bzz,
    signBytes: (bytes: Array<number>) => Promise.resolve(sign(bytes, keyPair)),
  })

  let uploadContent: string

  beforeEach(() => {
    uploadContent = Math.random()
      .toString(36)
      .slice(2)
  })

  it('supports setting and getting a chunk', async () => {
    const params = { user, name: uploadContent }
    const data = { test: uploadContent }
    await bzzFeed.setChunk(params, data)
    const res = await bzzFeed.getChunk(params)
    const value = await res.json()
    expect(value).toEqual(data)
  })

  it('creates a manifest', async () => {
    const hash = await bzzFeed.createManifest({ user, name: 'manifest' })
    expect(hash).toBeDefined()
  })

  it('uploads data and sets the feed chunk', async () => {
    jest.setTimeout(20000)
    const manifestHash = await bzzFeed.createManifest({
      user,
      name: uploadContent,
    })
    await bzzFeed.setContent(manifestHash, 'hello', {
      contentType: 'text/plain',
    })
    const res = await bzz.download(manifestHash)
    const value = await res.text()
    expect(value).toBe('hello')
  })

  it('sets and gets the feed content hash', async () => {
    const feedParams = { user, name: uploadContent }
    const uploadedHash = await bzz.uploadFile('hello', {
      contentType: 'text/plain',
    })
    await bzzFeed.setContentHash(feedParams, uploadedHash)
    const contentHash = await bzzFeed.getContentHash(feedParams)
    expect(contentHash).toBe(uploadedHash)
  })

  it('sets and gets the feed content', async () => {
    const feedParams = { user, name: uploadContent }
    await bzzFeed.setContent(feedParams, 'hello', {
      contentType: 'text/plain',
    })
    const res = await bzzFeed.getContent(feedParams)
    const text = await res.text()
    expect(text).toBe('hello')
  })

  it('sets and gets the raw feed content hash', async () => {
    const feedParams = { user, topic: FEED_ZERO_TOPIC, time: 0, level: 0 }
    const uploadedHash = await bzz.uploadFile('hello', {
      contentType: 'text/plain',
    })
    await bzzFeed.setRawContentHash(feedParams, uploadedHash)
    const contentHash = await bzzFeed.getRawContentHash(feedParams)
    expect(contentHash).toBe(uploadedHash)
  })

  it('sets and gets the raw feed content', async () => {
    const feedParams = { user, topic: FEED_ZERO_TOPIC, time: 0, level: 0 }
    await bzzFeed.setRawContent(feedParams, 'hello', {
      contentType: 'text/plain',
    })
    const res = await bzzFeed.getRawContent(feedParams)
    const text = await res.text()
    expect(text).toBe('hello')
  })

  it('supports chunk polling', done => {
    jest.setTimeout(40000)

    let step = '0-idle'
    let expectedValue: string

    const params = { user, name: uploadContent }
    const subscription = bzzFeed
      .pollChunk(params, { interval: 2000 })
      // eslint-disable-next-line @typescript-eslint/no-misused-promises
      .subscribe(async res => {
        /* eslint-disable require-atomic-updates */
        if (res === null) {
          if (step === '0-idle') {
            step = '1-first-value-post'
            await bzzFeed.setChunk(params, 'hello')
            expectedValue = 'hello'

            step = '2-first-value-posted'
          }
        } else {
          const value = await res.text()
          if (step === '2-first-value-posted') {
            expect(value).toBe(expectedValue)
            step = '3-first-value-received'
            await sleep(5000)
            step = '4-second-value-post'
            await bzzFeed.setChunk(params, 'world')
            expectedValue = 'world'
            step = '5-second-value-posted'
          } else if (step === '5-second-value-posted') {
            expect(value).toBe(expectedValue)
            subscription.unsubscribe()
            step = '6-unsubscribed'
            await sleep(5000)
            done()
          } else if (step === '6-unsubscribed') {
            throw new Error('Event received after unsubscribed')
          }
        }
        /* eslint-enable require-atomic-updates */
      })
  })

  it('supports feed content hash polling', done => {
    jest.setTimeout(40000)

    const params = { user, name: uploadContent }
    const post = async (value: string): Promise<string> => {
      return await bzzFeed.setContent(params, value, {
        contentType: 'text/plain',
      })
    }

    let step = '0-idle'
    let expectedHash: string
    let previousValue: string

    const subscription = bzzFeed
      .pollContentHash(params, {
        interval: 5000,
        changedOnly: true,
      })
      // eslint-disable-next-line @typescript-eslint/no-misused-promises
      .subscribe(async value => {
        /* eslint-disable require-atomic-updates */
        if (value === null) {
          if (step === '0-idle') {
            step = '1-first-value-post'
            expectedHash = await post('hello')
            step = '2-first-value-posted'
          }
        } else {
          expect(value).not.toBe(previousValue)
          previousValue = value

          if (step === '2-first-value-posted') {
            expect(value).toBe(expectedHash)
            step = '3-first-value-received'
            await sleep(8000)
            step = '4-second-value-post'
            expectedHash = await post('world')
            step = '5-second-value-posted'
          } else if (step === '5-second-value-posted') {
            expect(value).toBe(expectedHash)
            subscription.unsubscribe()
            done()
          }
        }
        /* eslint-enable require-atomic-updates */
      })
  })

  it('supports feed content polling', done => {
    jest.setTimeout(40000)

    const params = { user, name: uploadContent }
    const post = async (value: string): Promise<string> => {
      return await bzzFeed.setContent(params, value, {
        contentType: 'text/plain',
      })
    }

    let step = '0-idle'
    let expectedValue: string

    const subscription = bzzFeed
      .pollContent(params, {
        interval: 5000,
        changedOnly: true,
      })
      // eslint-disable-next-line @typescript-eslint/no-misused-promises
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
            expect(value).toBe(expectedValue)
            step = '3-first-value-received'
            await sleep(8000)
            step = '4-second-value-post'
            await post('world')
            expectedValue = 'world'
            step = '5-second-value-posted'
          } else if (step === '5-second-value-posted') {
            expect(value).toBe(expectedValue)
            subscription.unsubscribe()
            done()
          }
        }
        /* eslint-enable require-atomic-updates */
      })
  })

  it('feed polling fails on not found error if the option is enabled', done => {
    jest.setTimeout(10000)

    bzzFeed
      .pollChunk(
        { user, name: 'notfound' },
        { interval: 2000, whenEmpty: 'error', immediate: false },
      )
      .subscribe({
        next: () => {
          throw new Error('Subscription should not have emitted a value')
        },
        error: () => {
          done()
        },
      })
  })

  it('feed polling accepts an external trigger', done => {
    const trigger: Subject<void> = new Subject()
    const subscription = bzzFeed
      .pollChunk(
        { user, name: 'notfound' },
        { interval: 10000, immediate: false, trigger },
      )
      .subscribe(() => {
        subscription.unsubscribe()
        done()
      })
    // Test should timeout if the trigger is not executed
    trigger.next()
  })
})
