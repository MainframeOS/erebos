import Bzz from '../packages/api-bzz-node'
import Timeline, {
  PROTOCOL,
  VERSION,
  createChapter,
  validateChapter,
} from '../packages/feedlinks'
import { pubKeyToAddress } from '../packages/keccak256'
import { createKeyPair, sign } from '../packages/secp256k1'

describe('feedlinks', () => {
  const keyPair = createKeyPair()
  const author = pubKeyToAddress(keyPair.getPublic().encode())

  const bzz = new Bzz({
    signBytes: async digest => sign(digest, keyPair.getPrivate()),
    url: 'http://localhost:8500/',
  })
  const timeline = new Timeline({ bzz })

  it('exports the PROTOCOL and VERSION constants', () => {
    expect(PROTOCOL).toBe('feedlinks')
    expect(VERSION).toBe(1)
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
      protocol: 'feedlinks',
      version: 1,
      timestamp: now,
      type: 'text/plain',
      author,
      content: 'hello',
    })
  })

  it('provides a validateChapter() function', () => {
    expect(() => validateChapter({})).toThrow('Unsupported payload')
    expect(() =>
      validateChapter({ protocol: 'feedlinks', version: 0 }),
    ).toThrow('Unsupported payload')
    const valid = { protocol: 'feedlinks', version: 1 }
    expect(validateChapter(valid)).toBe(valid)
  })

  it('download() method downloads and decodes the chapter', async () => {
    const now = Date.now()
    Date.now = jest.fn(() => now)

    const chapter = createChapter({ author, content: { ok: true } })
    const [validID, invalidID] = await Promise.all([
      bzz.uploadFile(JSON.stringify(chapter)),
      bzz.uploadFile(JSON.stringify({ ok: false })),
    ])

    const valid = await timeline.download(validID)
    expect(valid).toEqual({
      id: validID,
      protocol: 'feedlinks',
      version: 1,
      timestamp: now,
      type: 'application/json',
      author,
      content: { ok: true },
    })

    expect(timeline.download(invalidID)).rejects.toThrow('Unsupported payload')
  })

  it('upload() method encodes and uploads the chapter', async () => {
    const chapter = createChapter({ author, content: { ok: true } })
    const id = await timeline.upload(chapter)
    const downloaded = await timeline.download(id)
    expect(downloaded).toEqual({ ...chapter, id })
  })

  it('supports custom encoding and decoding functions as method options', async () => {
    const sign = async data => {
      const bytes = Array.from(Buffer.from(JSON.stringify(data)))
      return await timeline._bzz.sign(bytes)
    }
    const decode = jest.fn(async res => {
      const chapter = await res.json()
      const { signature, ...rest } = chapter
      const verified = await sign(rest)
      expect(signature).toBe(verified)
      return chapter
    })
    const encode = jest.fn(async chapter => {
      chapter.signature = await sign(chapter)
      return JSON.stringify(chapter)
    })
    const chapter = createChapter({ author, content: { ok: true } })
    const id = await timeline.upload(chapter, { encode })
    expect(encode).toHaveBeenCalledTimes(1)
    const downloaded = await timeline.download(id, { decode })
    expect(decode).toHaveBeenCalledTimes(1)
    expect(downloaded).toEqual({ ...chapter, id })
  })

  it('supports custom encoding and decoding functions as instance options', async () => {
    const decode = jest.fn(async res => {
      const text = await res.text()
      expect(text.slice(0, 7)).toBe('ENCODED')
      return JSON.parse(text.slice(7))
    })
    const encode = jest.fn(chapter => {
      return `ENCODED${JSON.stringify(chapter)}`
    })
    const testTimeline = new Timeline({ bzz, decode, encode })
    const chapter = createChapter({ author, content: { ok: true } })
    const id = await testTimeline.upload(chapter, { encode })
    expect(encode).toHaveBeenCalledTimes(1)
    const downloaded = await testTimeline.download(id, { decode })
    expect(decode).toHaveBeenCalledTimes(1)
    expect(downloaded).toEqual({ ...chapter, id })
  })

  it('updateChapterID() and loadChapterID() methods manipulate a feed hash', async () => {
    jest.setTimeout(10000) // 10 secs
    const chapter = createChapter({ author, content: { ok: true } })
    const [feedHash, chapterID] = await Promise.all([
      bzz.createFeedManifest({ user: author, name: 'test-hash' }),
      timeline.upload(chapter),
    ])
    await timeline.updateChapterID(feedHash, chapterID)
    const id = await timeline.loadChapterID(feedHash)
    expect(id).toBe(chapterID)
  })

  it('addChapter() and loadChapter() methods manipulate a chapter', async () => {
    jest.setTimeout(10000) // 10 secs
    const chapter = createChapter({ author, content: { ok: true } })
    const feedHash = await bzz.createFeedManifest({
      user: author,
      name: 'test-chapter',
    })
    const chapterID = await timeline.addChapter(feedHash, chapter)
    const loadedChapter = await timeline.loadChapter(feedHash)
    expect(loadedChapter).toEqual({ ...chapter, id: chapterID })
  })

  it('createUpdater() returns a function to call to update the feed', async () => {
    jest.setTimeout(20000) // 20 secs

    const contents = ['first update', 'second update', 'third update']
    const params = { user: author, name: 'test-updater' }
    const updateTimeline = await timeline.createUpdater(params, {
      author,
      type: 'text/plain',
    })

    for (const content of contents) {
      await updateTimeline({ content })
      const chapter = await timeline.loadChapter(params)
      expect(chapter.content).toBe(content)
    }
  })

  it('createIterator() creates an AsyncIterator of the feed updates', async () => {
    jest.setTimeout(20000) // 20 secs

    const contents = ['one', 'two', 'three']
    const params = { user: author, name: 'test-iterator' }

    // Create the timeline with the given chapters
    const updateTimeline = await timeline.createUpdater(params, {
      author,
      type: 'text/plain',
    })
    for (const content of contents) {
      await updateTimeline({ content })
    }

    const chapterID = await timeline.loadChapterID(params)
    let i = 3
    for await (const chapter of timeline.createIterator(chapterID)) {
      // Iteration happens from most recent to oldest
      expect(chapter.content).toBe(contents[--i])
    }
    expect(i).toBe(0)
  })

  it('createSlice() returns a list of chapters within the given range', async () => {
    jest.setTimeout(20000) // 20 secs

    const contents = ['one', 'two', 'three', 'four', 'five']
    const params = { user: author, name: 'test-slice' }

    // Create the timeline with the given chapters
    const updateTimeline = await timeline.createUpdater(params, {
      author,
      type: 'text/plain',
    })

    const chapterIDs = []
    for (const content of contents) {
      const chapter = await updateTimeline({ content })
      chapterIDs.push(chapter.id)
    }

    const slice1 = await timeline.createSlice(chapterIDs[3], chapterIDs[0])
    expect(slice1.map(chapter => chapter.content)).toEqual([
      'four',
      'three',
      'two',
    ])

    const latestChapterID = await timeline.loadChapterID(params)
    const slice2 = await timeline.createSlice(latestChapterID, chapterIDs[1])
    expect(slice2.map(chapter => chapter.content)).toEqual([
      'five',
      'four',
      'three',
    ])
  })

  it('live() returns an observable of lists of chapters as they get polled', () => {
    jest.setTimeout(40000) // 40 secs

    const contents = [['one'], ['two', 'three', 'four'], ['five', 'six']]
    const params = { user: author, name: 'test-live' }

    return new Promise(async (resolve, reject) => {
      const updateTimeline = await timeline.createUpdater(params, {
        author,
        type: 'text/plain',
      })

      let i = 0
      const pushSlice = async () => {
        for (const content of contents[i]) {
          await updateTimeline({ content })
        }
      }

      const sub = timeline.live(params, { interval: 10000 }).subscribe({
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
