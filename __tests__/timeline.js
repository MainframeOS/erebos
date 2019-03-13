import Bzz from '../packages/api-bzz-node'
import createHex from '../packages/hex'
import { pubKeyToAddress } from '../packages/keccak256'
import { createKeyPair, sign, verify } from '../packages/secp256k1'
import {
  PROTOCOL,
  VERSION,
  VERSION_RANGE,
  Timeline,
  createChapter,
  validateChapter,
} from '../packages/timeline'

describe('timeline', () => {
  const keyPair = createKeyPair()
  const author = pubKeyToAddress(keyPair.getPublic().encode())

  const bzz = new Bzz({
    signBytes: async digest => sign(digest, keyPair.getPrivate()),
    url: 'http://localhost:8500/',
  })

  it('exports the PROTOCOL, VERSION and VERSION_RANGE constants', () => {
    expect(PROTOCOL).toBe('timeline')
    expect(VERSION).toBe('1.0.0')
    expect(VERSION_RANGE).toBe('^1.0.0')
  })

  it('provides a createChapter() function', () => {
    const now = Date.now()
    Date.now = jest.fn(() => now)
    const chapter = createChapter({
      author,
      type: 'text/plain',
      content: 'hello',
    })
    expect(chapter).toEqual({
      protocol: 'timeline',
      version: '1.0.0',
      timestamp: now,
      type: 'text/plain',
      author,
      content: 'hello',
    })
  })

  it('provides a validateChapter() function', () => {
    expect(() => validateChapter({})).toThrow('Invalid payload')
    expect(() =>
      validateChapter({ protocol: 'test', version: '1.0.0' }),
    ).toThrow('Unsupported protocol')
    expect(() => validateChapter({ protocol: 'timeline', version: 0 })).toThrow(
      'Unsupported protocol version',
    )
    expect(() =>
      validateChapter({ protocol: 'timeline', version: '2.0.0' }),
    ).toThrow('Unsupported protocol version')
    const valid = { protocol: 'timeline/test', version: '1.0.0' }
    expect(validateChapter(valid)).toBe(valid)
  })

  it('download() method downloads and decodes the chapter', async () => {
    const now = Date.now()
    Date.now = jest.fn(() => now)

    const timeline = new Timeline({ bzz })
    const chapter = createChapter({ author, content: { ok: true } })
    const [validID, invalidID] = await Promise.all([
      bzz.uploadFile(JSON.stringify(chapter)),
      bzz.uploadFile(JSON.stringify({ ok: false })),
    ])

    const valid = await timeline.download(validID)
    expect(valid).toEqual({
      id: validID,
      protocol: 'timeline',
      version: '1.0.0',
      timestamp: now,
      type: 'application/json',
      author,
      content: { ok: true },
    })

    expect(timeline.download(invalidID)).rejects.toThrow('Invalid payload')
  })

  it('upload() method encodes and uploads the chapter', async () => {
    const timeline = new Timeline({ bzz })
    const chapter = createChapter({ author, content: { ok: true } })
    const id = await timeline.upload(chapter)
    const downloaded = await timeline.download(id)
    expect(downloaded).toEqual({ ...chapter, id })
  })

  it('supports custom encoding and decoding functions', async () => {
    const sign = async data => {
      const bytes = Array.from(Buffer.from(JSON.stringify(data)))
      return await bzz.sign(bytes)
    }
    const decode = jest.fn(async res => {
      const chapter = await res.json()
      const { signature, ...rest } = chapter
      const msg = createHex(rest)
        .toBuffer()
        .toString('hex')
      const sig = createHex(signature).toBytesArray()
      expect(verify(msg, sig, keyPair.getPublic('hex'))).toBe(true)
      return chapter
    })
    const encode = jest.fn(async chapter => {
      chapter.signature = await sign(chapter)
      return JSON.stringify(chapter)
    })

    const timeline = new Timeline({ bzz, decode, encode })
    const chapter = createChapter({ author, content: { ok: true } })

    const id = await timeline.upload(chapter)
    expect(encode).toHaveBeenCalledTimes(1)

    const downloaded = await timeline.download(id)
    expect(decode).toHaveBeenCalledTimes(1)
    expect(downloaded).toEqual({ ...chapter, id })
  })

  it('updateChapterID() and getChapterID() methods manipulate a feed hash', async () => {
    jest.setTimeout(10000) // 10 secs

    const feed = await bzz.createFeedManifest({
      user: author,
      name: 'test-hash',
    })
    const timeline = new Timeline({ bzz, feed })

    const chapter = createChapter({ author, content: { ok: true } })
    const chapterID = await timeline.upload(chapter)

    await timeline.updateChapterID(chapterID)
    const id = await timeline.getChapterID()
    expect(id).toBe(chapterID)
  })

  it('addChapter() and loadChapter() methods manipulate a chapter', async () => {
    jest.setTimeout(10000) // 10 secs

    const feed = await bzz.createFeedManifest({
      user: author,
      name: 'test-chapter',
    })
    const timeline = new Timeline({ bzz, feed })

    const chapter = createChapter({ author, content: { ok: true } })
    const chapterID = await timeline.addChapter(chapter)
    const loadedChapter = await timeline.loadChapter()

    expect(loadedChapter).toEqual({ ...chapter, id: chapterID })
  })

  it('createUpdater() returns a function to call to update the feed', async () => {
    jest.setTimeout(20000) // 20 secs

    const contents = ['first update', 'second update', 'third update']

    const timeline = new Timeline({
      bzz,
      feed: { user: author, name: 'test-updater' },
    })
    const updateTimeline = timeline.createUpdater({
      author,
      type: 'text/plain',
    })

    for (const content of contents) {
      await updateTimeline({ content })
      const chapter = await timeline.loadChapter()
      expect(chapter.content).toBe(content)
    }
  })

  it('createIterator() creates an AsyncIterator of the feed updates', async () => {
    jest.setTimeout(20000) // 20 secs

    const contents = ['one', 'two', 'three']
    const timeline = new Timeline({
      bzz,
      feed: { user: author, name: 'test-iterator' },
    })

    // Create the timeline with the given chapters
    const updateTimeline = await timeline.createUpdater({
      author,
      type: 'text/plain',
    })
    const chapterIDs = []
    for (const content of contents) {
      const chapter = await updateTimeline({ content })
      chapterIDs.push(chapter.id)
    }

    // Get all the chapters from the latest (no argument)
    let i = 3
    for await (const chapter of timeline.createIterator()) {
      // Iteration happens from most recent to oldest
      expect(chapter.content).toBe(contents[--i])
    }
    expect(i).toBe(0)

    // Get all the chapters from the provided chapter ID
    let j = 2
    for await (const chapter of timeline.createIterator(chapterIDs[1])) {
      // Iteration happens from most recent to oldest
      expect(chapter.content).toBe(contents[--j])
    }
    expect(j).toBe(0)
  })

  it('loadChapters() returns an array of chapters within the given range', async () => {
    jest.setTimeout(20000) // 20 secs

    const contents = ['one', 'two', 'three', 'four', 'five']
    const timeline = new Timeline({
      bzz,
      feed: { user: author, name: 'test-slice' },
    })

    // Create the timeline with the given chapters
    const updateTimeline = timeline.createUpdater({
      author,
      type: 'text/plain',
    })

    const chapterIDs = []
    for (const content of contents) {
      const chapter = await updateTimeline({ content })
      chapterIDs.push(chapter.id)
    }

    const slice1 = await timeline.loadChapters(chapterIDs[3], chapterIDs[0])
    expect(slice1.map(chapter => chapter.content)).toEqual([
      'four',
      'three',
      'two',
    ])

    const latestChapterID = await timeline.getChapterID()
    const slice2 = await timeline.loadChapters(latestChapterID, chapterIDs[1])
    expect(slice2.map(chapter => chapter.content)).toEqual([
      'five',
      'four',
      'three',
    ])
  })

  it('live() returns an observable of lists of chapters as they get polled', () => {
    jest.setTimeout(40000) // 40 secs

    const contents = [['one'], ['two', 'three', 'four'], ['five', 'six']]
    const timeline = new Timeline({
      bzz,
      feed: { user: author, name: 'test-live' },
    })

    return new Promise(async (resolve, reject) => {
      const updateTimeline = timeline.createUpdater({
        author,
        type: 'text/plain',
      })

      let i = 0
      const pushSlice = async () => {
        for (const content of contents[i]) {
          await updateTimeline({ content })
        }
      }

      const sub = timeline.live({ interval: 10000 }).subscribe({
        next: chapters => {
          expect(chapters.map(l => l.content)).toEqual(contents[i])
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
