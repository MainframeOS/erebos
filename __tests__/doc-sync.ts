import {
  DocReader,
  DocWriter,
  DocSubscriber,
  DocSynchronizer,
  downloadDoc,
  downloadMeta,
} from '@erebos/doc-sync'
import { BzzFeed } from '@erebos/bzz-feed'
import { BzzNode } from '@erebos/bzz-node'
import { DataListReader } from '@erebos/feed-list'
import { pubKeyToAddress } from '@erebos/keccak256'
import { createKeyPair, sign } from '@erebos/secp256k1'

interface FeedUser {
  user: string
}

interface Config {
  bzz: BzzFeed<any, any>
  feed: FeedUser
}

describe('doc-sync', () => {
  function createConfig(): Config {
    const keyPair = createKeyPair()
    const user = pubKeyToAddress(keyPair.getPublic('array'))
    const bzz = new BzzFeed({
      bzz: new BzzNode({ url: 'http://localhost:8500' }),
      signBytes: (bytes: Array<number>) => {
        return Promise.resolve(sign(bytes, keyPair))
      },
    })
    return { bzz, feed: { user } }
  }

  describe('DocReader and DocWriter', () => {
    it('basic flow works between reader and writer', async done => {
      interface T {
        hello: string
      }
      const config = createConfig()
      const writer = DocWriter.create<T>(config)

      writer.change(doc => {
        doc.hello = 'world'
      })
      await writer.push()
      expect(writer).toHaveLength(1)

      writer.change(doc => {
        doc.hello = 'there'
      })
      await writer.push()
      expect(writer).toHaveLength(2)

      const reader = await DocReader.load<T>({
        bzz: config.bzz,
        feed: writer.metaFeed,
      })
      expect(reader.value).toEqual({ hello: 'there' })

      const subscription = reader.subscribe(value => {
        if (value.hello === 'world') {
          subscription.unsubscribe()
          done()
        }
      })

      writer.change(doc => {
        doc.hello = 'world'
      })
      await writer.push()
      await reader.pull()
    })

    it('uses snapshots', async () => {
      interface T {
        count: string
      }
      const config = createConfig()

      const writer = DocWriter.create<T>({ ...config, snapshotFrequency: 2 })
      for (const count of ['one', 'two', 'three', 'four', 'five', 'six']) {
        writer.change(doc => {
          doc.count = count
        })
        await writer.push()
      }

      const meta = await downloadMeta(config.bzz, writer.metaFeed)
      const list = new DataListReader({ bzz: config.bzz, feed: meta.dataFeed })
      const spy = jest.spyOn(list, 'createForwardsIterator')

      const doc = await downloadDoc<T>(config.bzz, writer.metaFeed, list)
      expect(doc.count).toBe('six')
      // Iteration for changes should start from the 5th index as the 4th one should contain the snapshot
      expect(spy.mock.calls[0][0]).toBe(5)
    })
  })

  describe('DocSubscriber', () => {
    it('pulls at the given interval', async done => {
      interface T {
        test: string
      }
      const config = createConfig()
      const writer = await DocWriter.init<T>({
        ...config,
        doc: { test: 'first' },
      })

      const subscriber = await DocSubscriber.load<T>({
        bzz: config.bzz,
        feed: writer.metaFeed,
        pullInterval: 1000,
      })
      const subscription = subscriber.subscribe(data => {
        if (data.test === 'third') {
          subscription.unsubscribe()
          subscriber.stop()
          done()
        }
      })

      writer.change(doc => {
        doc.test = 'second'
      })
      await writer.push()

      await subscriber.pull()
      expect(subscriber.value.test).toBe('second')

      writer.change(doc => {
        doc.test = 'third'
      })
      await writer.push()
    })
  })

  describe('DocSynchronizer', () => {
    it('synchronizes changes from multiple sources', async done => {
      jest.setTimeout(10000)

      interface T {
        alice?: string
        bob?: string
        chloe?: string
        dan?: string
      }

      const [alice, bob, chloe] = await Promise.all([
        DocWriter.init<T>({ ...createConfig(), doc: { alice: 'hello' } }),
        DocWriter.init<T>({ ...createConfig(), doc: { bob: 'hello' } }),
        DocWriter.init<T>({ ...createConfig(), doc: { chloe: 'hello' } }),
      ])

      const dan = await DocSynchronizer.init<T>({
        ...createConfig(),
        doc: { dan: 'hello' },
        pullInterval: 1000,
        pushInterval: 1000,
        sources: [alice.metaFeed, bob.metaFeed, chloe.metaFeed],
      })

      expect(dan.value).toEqual({
        alice: 'hello',
        bob: 'hello',
        chloe: 'hello',
        dan: 'hello',
      })

      const subscription = dan.subscribe(doc => {
        if (
          `${doc.alice}-${doc.bob}-${doc.chloe}-${doc.dan}` ===
          'one-two-three-four'
        ) {
          subscription.unsubscribe()
          dan.stop()
          done()
        }
      })

      alice.change(doc => {
        doc.alice = 'one'
      })
      bob.change(doc => {
        doc.bob = 'two'
      })
      chloe.change(doc => {
        doc.chloe = 'three'
      })
      dan.change(doc => {
        doc.dan = 'four'
      })
      await Promise.all([alice.push(), bob.push(), chloe.push()])
    })
  })
})
