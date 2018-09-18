---
title: Examples
---

## File storage using the official Swarm gateway

```javascript
import { SwarmClient } from '@erebos/swarm-browser'

const client = new SwarmClient('https://swarm-gateways.net')

client.bzz
  .upload('Hello world!', { contentType: 'text/plain' })
  .then(hash => client.bzz.download(hash))
  .then(res => res.text())
  .then(text => {
    console.log(text) // "Hello world!"
  })
```

[File storage APIs reference](api-bzz.md)

## File storage using a local Swarm node

```javascript
import path from 'path'
import { SwarmClient } from '@erebos/swarm-node'

const client = new SwarmClient('http://localhost:8500')

client.bzz
  .uploadDirectoryFrom(path.join(__dirname, 'my-files'))
  .then(hash => client.bzz.list(hash))
  .then(contents => {
    console.log(contents) // Manifest contents describing the uploaded files
  })
```

[File storage APIs reference](api-bzz.md)

## Communication between two nodes

```javascript
import { SwarmClient, decodeHex, encodeHex } from '@erebos/swarm-node'

const run = async () => {
  // Create PSS clients over WebSocket
  const alice = new SwarmClient('ws://localhost:8501')
  const bob = new SwarmClient('ws://localhost:8502')

  // Retrieve Alice's public key and create the topic
  const [key, topic] = await Promise.all([
    alice.pss.getPublicKey(),
    alice.pss.stringToTopic('PSS rocks'),
  ])

  // Make Alice subscribe to the created topic and Bob add her public key
  const [subscription] = await Promise.all([
    alice.pss.subscribeTopic(topic),
    bob.pss.setPeerPublicKey(key, topic),
  ])

  // Actually subscribe to the messages stream
  alice.pss.createSubscription(subscription).subscribe(payload => {
    const msg = decodeHex(payload.Msg)
    console.log(`received message from ${payload.Key}: ${msg}`)
  })

  // Send message to Alice
  bob.pss.sendAsym(key, topic, encodeHex('hello world'))
}

run().catch(console.error)
```

[Messaging APIs reference](api-pss.md)
