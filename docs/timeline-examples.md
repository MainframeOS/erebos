---
title: Timeline example
---

## Asynchronous messaging

```javascript
import { Bzz } from '@erebos/api-bzz-node'
import { pubKeyToAddress } from '@erebos/keccak256'
import { createKeyPair, sign } from '@erebos/secp256k1'
import { TimelineReader, TimelineWriter } from '@erebos/timeline'

const BZZ_URL = 'http://localhost:8500'
const FEED_NAME = 'alice-bob'

// This setup is meant for demonstration purpose only - keys and signatures security must be handled by the application
const keyPair = createKeyPair()
const signBytes = async bytes => sign(bytes, keyPair)
const bzz = new Bzz({ url: BZZ_URL, signBytes })

// In this example we are Alice communicating with Bob
const aliceAddress = pubKeyToAddress(keyPair.getPublic('array'))
const aliceTimeline = new TimelineWriter({
  bzz,
  feed: { user: aliceAddress, name: FEED_NAME },
})

// The provided metadata will be added to each message
const aliceSend = aliceTimeline.createAddChapter({
  author: aliceAddress,
  type: 'text/plain',
})
// Alice will be able to add messages to her timeline calling this function, it simply abstracts away the underlying Chapter data structure that the updater uses
const sendMessage = async content => {
  await aliceSend({ content })
}

// Bob's address must be know by Alice
const bobsAddress = '...'
const bobTimeline = new TimelineReader({
  bzz,
  feed: { user: bobAddress, name: FEED_NAME },
})

// This creates an AsyncIterator that can be used to retrieve previous messages in the timeline
const getPreviousMessage = bobTimeline.createIterator()

// Listen to new messages added to Bob's timeline
const bobsNewMessages = bobTimeline
  .live({ interval: 10000 }) // 10 seconds
  .subscribe(chapters => {
    chapters.forEach(c => {
      console.log(`New message from Bob: ${c.content}`)
    })
  })

const getMessageAndSayHello = async () => {
  // Iteration is performed in reverse chronological order
  const latestMessage = await getPreviousMessage.next()
  if (latestMessage != null) {
    console.log(`Latest message from Bob: ${c.content}`)
  }
  await sendMessage('Hello!')
}
```
