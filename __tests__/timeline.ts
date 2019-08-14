import { Bzz } from '../packages/api-bzz-node'
import { createHex } from '../packages/hex'
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
  const author = pubKeyToAddress(keyPair.getPublic('array'))

  const bzz = new Bzz({
    signBytes: bytes => Promise.resolve(sign(bytes, keyPair)),
    url: 'http://localhost:8500/',
  })

  it('exports the PROTOCOL, VERSION and VERSION_RANGE constants', () => {
    expect(PROTOCOL).toBe('timeline')
    expect(VERSION).toBe('1.0.0')
    expect(VERSION_RANGE).toBe('^1.0.0')
  })

  it('provides a createChapter() function', () => {
    const now = Date.now()
    // eslint-disable-next-line @typescript-eslint/unbound-method
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
    const valid = { protocol: 'timeline', version: '1.0.0' }
    expect(validateChapter(valid)).toBe(valid)
  })

  it('getChapter() method downloads and decodes the chapter', async () => {
    const now = Date.now()
    // eslint-disable-next-line @typescript-eslint/unbound-method
    Date.now = jest.fn(() => now)

    const timeline = new Timeline({ bzz })
    const chapter = createChapter({ author, content: { ok: true } })
    const [validID, invalidID] = await Promise.all([
      bzz.uploadFile(JSON.stringify(chapter)),
      bzz.uploadFile(JSON.stringify({ ok: false })),
    ])

    const valid = await timeline.getChapter(validID)
    expect(valid).toEqual({
      id: validID,
      protocol: 'timeline',
      version: '1.0.0',
      timestamp: now,
      type: 'application/json',
      author,
      content: { ok: true },
    })

    await expect(timeline.getChapter(invalidID)).rejects.toThrow(
      'Invalid payload',
    )
  })

  it('postChapter() method encodes and uploads the chapter', async () => {
    const timeline = new Timeline({ bzz })
    const chapter = createChapter({ author, content: { ok: true } })
    const id = await timeline.postChapter(chapter)
    const downloaded = await timeline.getChapter(id)
    expect(downloaded).toEqual({ ...chapter, id })
  })

  it('supports custom encoding and decoding functions', async () => {
    const decode = jest.fn(async res => {
      const chapter = await res.json()
      const { signature, ...rest } = chapter
      const msg = createHex(rest).toBytesArray()
      const sig = createHex(signature).toBytesArray()
      expect(verify(msg, sig, keyPair.getPublic('hex'))).toBe(true)
      return chapter
    })

    const encode = jest.fn(async chapter => {
      // eslint-disable-next-line require-atomic-updates
      chapter.signature = await bzz.sign(createHex(chapter).toBytesArray())
      return JSON.stringify(chapter)
    })

    const timeline = new Timeline({ bzz, decode, encode })
    const chapter = createChapter({ author, content: { ok: true } })

    const id = await timeline.postChapter(chapter)
    expect(encode).toHaveBeenCalledTimes(1)

    const downloaded = await timeline.getChapter(id)
    expect(decode).toHaveBeenCalledTimes(1)
    expect(downloaded).toEqual({ ...chapter, id })
  })

  it('setLatestChapterID() and getLatestChapterID() methods manipulate a feed hash', async () => {
    jest.setTimeout(10000) // 10 secs

    const feed = await bzz.createFeedManifest({
      user: author,
      name: 'test-hash',
    })
    const timeline = new Timeline({ bzz, feed })

    const chapter = createChapter({ author, content: { ok: true } })
    const chapterID = await timeline.postChapter(chapter)

    await timeline.setLatestChapterID(chapterID)
    const id = await timeline.getLatestChapterID()
    expect(id).toBe(chapterID)
  })

  it('setLatestChapter() and getLatestChapter() methods manipulate a chapter', async () => {
    jest.setTimeout(10000) // 10 secs

    const timeline = new Timeline({
      bzz,
      feed: { user: author, name: 'test-chapter' },
    })

    const chapter = createChapter({ author, content: { ok: true } })
    const chapterID = await timeline.setLatestChapter(chapter)
    const loadedChapter = await timeline.getLatestChapter()

    expect(loadedChapter).toEqual({ ...chapter, id: chapterID })
  })

  it('addChapter() method retrieves the previous chapter when needed', async () => {
    jest.setTimeout(10000) // 10 secs

    const timeline = new Timeline({
      bzz,
      feed: { user: author, name: 'test-add-chapter' },
    })

    const chapter = createChapter({ author, content: { ok: true } })
    const previousChapterID = await timeline.setLatestChapter(chapter)
    const addedChapter = await timeline.addChapter(chapter)
    const loadedChapter = await timeline.getLatestChapter()

    expect(loadedChapter).toEqual({
      ...chapter,
      id: addedChapter.id,
      previous: previousChapterID,
    })
  })

  it('createAddChapter() returns a function to call to add to the feed', async () => {
    jest.setTimeout(20000) // 20 secs

    const contents = ['first update', 'second update', 'third update']

    const timeline = new Timeline({
      bzz,
      feed: { user: author, name: 'test-updater' },
    })
    const addChapter = timeline.createAddChapter({
      author,
      type: 'text/plain',
    })

    for (const content of contents) {
      await addChapter({ content })
      const chapter = await timeline.getLatestChapter()
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
    const addChapter = timeline.createAddChapter({
      author,
      type: 'text/plain',
    })
    const chapterIDs = []
    for (const content of contents) {
      const chapter = await addChapter({ content })
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

  it('createLoader() returns an Observable of chapters within the given range', async done => {
    jest.setTimeout(20000) // 20 secs

    const contents = ['one', 'two', 'three', 'four', 'five']
    const timeline = new Timeline({
      bzz,
      feed: { user: author, name: 'test-loader' },
    })

    // Create the timeline with the given chapters
    const addChapter = timeline.createAddChapter({
      author,
      type: 'text/plain',
    })

    const chapterIDs = []
    for (const content of contents) {
      const chapter = await addChapter({ content })
      chapterIDs.push(chapter.id)
    }

    let index = 3
    timeline.createLoader(chapterIDs[3], chapterIDs[0]).subscribe({
      next: chapter => {
        expect(chapter.content).toBe(contents[index--])
      },
      complete: () => {
        expect(index).toBe(0)
        done()
      },
      error: err => {
        throw err
      },
    })
  })

  it('getChapters() returns an array of chapters within the given range', async () => {
    jest.setTimeout(20000) // 20 secs

    const contents = ['one', 'two', 'three', 'four', 'five']
    const timeline = new Timeline({
      bzz,
      feed: { user: author, name: 'test-slice' },
    })

    // Create the timeline with the given chapters
    const addChapter = timeline.createAddChapter({
      author,
      type: 'text/plain',
    })

    const chapterIDs = []
    for (const content of contents) {
      const chapter = await addChapter({ content })
      chapterIDs.push(chapter.id)
    }

    const slice1 = await timeline.getChapters(chapterIDs[3], chapterIDs[0])
    expect(slice1.map(chapter => chapter.content)).toEqual([
      'four',
      'three',
      'two',
    ])

    const latestChapterID = await timeline.getLatestChapterID()
    const slice2 = await timeline.getChapters(latestChapterID, chapterIDs[1])
    expect(slice2.map(chapter => chapter.content)).toEqual([
      'five',
      'four',
      'three',
    ])
  })

  it('pollLatestChapter() returns an observable of the latest chapter', async done => {
    jest.setTimeout(40000) // 40 secs

    const contents = ['one', 'two', 'three']
    const timeline = new Timeline({
      bzz,
      feed: { user: author, name: 'test-poll' },
    })

    const addChapter = timeline.createAddChapter({
      author,
      type: 'text/plain',
    })

    let i = 0
    const pushNext = async (): Promise<void> => {
      await addChapter({ content: contents[i] })
    }

    const sub = timeline.pollLatestChapter({ interval: 10000 }).subscribe({
      next: chapter => {
        expect(chapter.content).toBe(contents[i])
        if (++i === 3) {
          sub.unsubscribe()
          done()
        } else {
          pushNext()
        }
      },
      error: err => {
        throw err
      },
    })

    await pushNext()
  })

  it('live() returns an observable of lists of chapters as they get polled', done => {
    jest.setTimeout(40000) // 40 secs

    const contents = [['one'], ['two', 'three', 'four'], ['five', 'six']]
    const timeline = new Timeline({
      bzz,
      feed: { user: author, name: 'test-live' },
    })

    const addChapter = timeline.createAddChapter({
      author,
      type: 'text/plain',
    })

    let i = 0
    const pushSlice = async (): Promise<void> => {
      for (const content of contents[i]) {
        await addChapter({ content })
      }
    }

    const sub = timeline.live({ interval: 10000 }).subscribe({
      next: chapters => {
        expect(chapters.map(l => l.content)).toEqual(contents[i])
        if (++i === 3) {
          sub.unsubscribe()
          done()
        } else {
          pushSlice()
        }
      },
      error: err => {
        throw err
      },
    })

    // Push first slice
    pushSlice()
  })
})
