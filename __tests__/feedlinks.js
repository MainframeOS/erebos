import Bzz from '../packages/api-bzz-node'
import Feedlinks, {
  PROTOCOL,
  VERSION,
  createLink,
  validateLink,
} from '../packages/feedlinks'
import { pubKeyToAddress } from '../packages/keccak256'
import { createKeyPair, sign } from '../packages/secp256k1'

describe('feedlinks', () => {
  const keyPair = createKeyPair()
  const address = pubKeyToAddress(keyPair.getPublic().encode())

  const bzz = new Bzz({
    signFeedDigest: async digest => sign(digest, keyPair.getPrivate()),
    url: 'http://localhost:8500/',
  })
  const feed = new Feedlinks({ bzz })

  it('exports the PROTOCOL and VERSION constants', () => {
    expect(PROTOCOL).toBe('feedlinks')
    expect(VERSION).toBe(1)
  })

  it('provides a createLink() function', () => {
    const now = Date.now()
    Date.now = jest.fn(() => now)
    const link = createLink({ type: 'text/plain', content: 'hello' })
    expect(link).toEqual({
      protocol: 'feedlinks',
      version: 1,
      timestamp: Math.floor(now / 1000),
      type: 'text/plain',
      content: 'hello',
    })
  })

  it('provides a validateLink() function', () => {
    expect(() => validateLink({})).toThrow('Unsupported payload')
    expect(() => validateLink({ protocol: 'feedlinks', version: 0 })).toThrow(
      'Unsupported payload',
    )
    const valid = { protocol: 'feedlinks', version: 1 }
    expect(validateLink(valid)).toBe(valid)
  })

  it('download() method downloads and decodes the link', async () => {
    const now = Date.now()
    Date.now = jest.fn(() => now)

    const [validHash, invalidHash] = await Promise.all([
      bzz.uploadFile(JSON.stringify(createLink({ content: { ok: true } })), {
        contentType: 'application/json',
      }),
      bzz.uploadFile(JSON.stringify({ ok: false }), {
        contentType: 'application/json',
      }),
    ])

    const valid = await feed.download(validHash)
    expect(valid).toEqual({
      protocol: 'feedlinks',
      version: 1,
      timestamp: Math.floor(now / 1000),
      type: 'application/json',
      content: { ok: true },
    })

    expect(feed.download(invalidHash)).rejects.toThrow('Unsupported payload')
  })

  it('upload() method encodes and uploads the link', async () => {
    const link = createLink({ content: { ok: true } })
    const hash = await feed.upload(link)
    const downloaded = await feed.download(hash)
    expect(downloaded).toEqual(link)
  })

  it('supports custom encoding and decoding functions as method options', async () => {
    const decode = jest.fn(async res => {
      const text = await res.text()
      expect(text.slice(0, 7)).toBe('ENCODED')
      return JSON.parse(text.slice(7))
    })
    const encode = jest.fn(link => {
      return `ENCODED${JSON.stringify(link)}`
    })
    const link = createLink({ content: { ok: true } })
    const hash = await feed.upload(link, { encode })
    expect(encode).toHaveBeenCalledTimes(1)
    const downloaded = await feed.download(hash, { decode })
    expect(decode).toHaveBeenCalledTimes(1)
    expect(downloaded).toEqual(link)
  })

  it('supports custom encoding and decoding functions as instance options', async () => {
    const decode = jest.fn(async res => {
      const text = await res.text()
      expect(text.slice(0, 7)).toBe('ENCODED')
      return JSON.parse(text.slice(7))
    })
    const encode = jest.fn(link => {
      return `ENCODED${JSON.stringify(link)}`
    })
    const testFeed = new Feedlinks({ bzz, decode, encode })
    const link = createLink({ content: { ok: true } })
    const hash = await testFeed.upload(link, { encode })
    expect(encode).toHaveBeenCalledTimes(1)
    const downloaded = await testFeed.download(hash, { decode })
    expect(decode).toHaveBeenCalledTimes(1)
    expect(downloaded).toEqual(link)
  })

  it('updateHash() and loadHash() methods manipulate a feed hash', async () => {
    jest.setTimeout(10000) // 10 secs
    const link = createLink({ content: { ok: true } })
    const [feedHash, linkHash] = await Promise.all([
      bzz.createFeedManifest(address, { name: 'test-hash' }),
      feed.upload(link),
    ])
    await feed.updateHash(feedHash, linkHash)
    const feedLinkHash = await feed.loadHash(feedHash)
    expect(feedLinkHash).toBe(linkHash)
  })

  it('updateLink() and loadLink() methods manipulate a feed link', async () => {
    jest.setTimeout(10000) // 10 secs
    const link = createLink({ content: { ok: true } })
    const feedHash = await bzz.createFeedManifest(address, {
      name: 'test-link',
    })
    await feed.updateLink(feedHash, link)
    const feedLink = await feed.loadLink(feedHash)
    expect(feedLink).toEqual(link)
  })

  it('loadUpdate() methods returns both the link hash and data', async () => {
    jest.setTimeout(10000) // 10 secs
    const link = createLink({ content: { ok: true } })
    const feedHash = await bzz.createFeedManifest(address, {
      name: 'test-update',
    })
    const hash = await feed.updateLink(feedHash, link)
    const update = await feed.loadUpdate(feedHash)
    expect(update).toEqual({ hash, link })
  })

  it('createUpdater() returns a function to call to update the feed', async () => {
    jest.setTimeout(20000) // 20 secs

    const contents = ['first update', 'second update', 'third update']
    const feedHash = await bzz.createFeedManifest(address, {
      name: 'test-updater',
    })
    const updateFeed = await feed.createUpdater(feedHash, {
      type: 'text/plain',
    })

    for (const content of contents) {
      await updateFeed({ content })
      const link = await feed.loadLink(feedHash)
      expect(link.content).toBe(content)
    }
  })

  it('createIterator() creates an AsyncIterator of the feed updates', async () => {
    jest.setTimeout(20000) // 20 secs

    const contents = ['one', 'two', 'three']
    const feedHash = await bzz.createFeedManifest(address, {
      name: 'test-iterator',
    })

    // Create the feed with the given links
    const updateFeed = await feed.createUpdater(feedHash, {
      type: 'text/plain',
    })
    for (const content of contents) {
      await updateFeed({ content })
    }

    let i = 3
    for await (const link of feed.createIterator(feedHash)) {
      // Iteration happens from most recent to oldest
      expect(link.content).toBe(contents[--i])
    }
    expect(i).toBe(0)
  })

  it('createSlice() returns a list of links within the given range', async () => {
    jest.setTimeout(20000) // 20 secs

    const contents = ['one', 'two', 'three', 'four', 'five']
    const feedHash = await bzz.createFeedManifest(address, {
      name: 'test-slice',
    })

    // Create the feed with the given links
    const updateFeed = await feed.createUpdater(feedHash, {
      type: 'text/plain',
    })

    const hashes = []
    for (const content of contents) {
      const update = await updateFeed({ content })
      hashes.push(update.hash)
    }

    const slice1 = await feed.createSlice(hashes[3], hashes[0])
    expect(slice1.map(link => link.content)).toEqual(['four', 'three', 'two'])

    const slice2 = await feed.createSlice(feedHash, hashes[1])
    expect(slice2.map(link => link.content)).toEqual(['five', 'four', 'three'])
  })

  it('live() returns an observable of lists of links as they get polled', () => {
    jest.setTimeout(40000) // 40 secs

    const contents = [['one'], ['two', 'three', 'four'], ['five', 'six']]

    return new Promise(async (resolve, reject) => {
      const feedHash = await bzz.createFeedManifest(address, {
        name: 'test-live',
      })

      const updateFeed = await feed.createUpdater(feedHash, {
        type: 'text/plain',
      })

      let i = 0
      const pushSlice = async () => {
        for (const content of contents[i]) {
          await updateFeed({ content })
        }
      }

      const sub = feed.live(feedHash, { interval: 10000 }).subscribe({
        next: links => {
          expect(links.map(l => l.content)).toEqual(contents[i])
          if (++i === 3) {
            sub.unsubscribe()
            resolve()
          } else {
            pushSlice()
          }
        },
        error: err => {
          reject(err)
        },
      })

      // Push first slice
      pushSlice()
    })
  })
})
