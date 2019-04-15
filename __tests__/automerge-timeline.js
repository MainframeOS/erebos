import Bzz from '../packages/api-bzz-node'
import { pubKeyToAddress } from '../packages/keccak256'
import { createKeyPair, sign } from '../packages/secp256k1'
import {
  DocPublisher,
  DocSubject,
  DocSubscriber,
  DocSynchronizer,
} from '../packages/automerge-timeline'
import { Timeline } from '../packages/timeline'

const subscribeAndWait = (observable, next) => {
  return new Promise((resolve, reject) => {
    observable.subscribe({
      next: val => {
        try {
          resolve(next(val))
        } catch (err) {
          reject(err)
        }
      },
      error: err => {
        reject(err)
      },
    })
  })
}

describe('automerge-timeline', () => {
  const bzz = new Bzz({
    signBytes: async (bytes, key) => sign(bytes, key),
    url: 'http://localhost:8500/',
  })

  const createPublisherTimeline = name => {
    const kp = createKeyPair()
    const user = pubKeyToAddress(kp.getPublic().encode())
    const timeline = new Timeline({
      bzz,
      feed: { user, name },
      signParams: kp.getPrivate(),
    })
    return { user, timeline }
  }

  let feedName

  beforeEach(() => {
    feedName = Math.random()
      .toString(36)
      .slice(2)
  })

  it('creates a publisher and subscriber', async () => {
    jest.setTimeout(20000) // 20 secs

    const pub = createPublisherTimeline(feedName)
    const publisher = new DocPublisher({ timeline: pub.timeline })

    const sub = new Timeline({
      bzz,
      feed: { user: pub.user, name: feedName },
    })
    const subscriber = new DocSubscriber({ timeline: sub })

    await Promise.all([publisher.init(), subscriber.init()])

    publisher.change(doc => {
      doc.hello = 'world'
    })
    await publisher.publish()

    const expected = doc => {
      expect(doc.hello).toBe('world')
    }

    await Promise.all([
      subscribeAndWait(publisher, expected),
      subscribeAndWait(subscriber, expected),
    ])
  })
})
