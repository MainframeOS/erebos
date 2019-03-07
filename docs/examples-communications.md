---
title: Communications examples
---

[Communication APIs reference](api-pss.md)

## Communication between two nodes using asymmetric encryption

```javascript
import { SwarmClient } from '@erebos/swarm-node'

const run = async () => {
  // Create PSS clients over WebSocket
  const alice = new SwarmClient({ pss: 'ws://localhost:8501' })
  const bob = new SwarmClient({ pss: 'ws://localhost:8502' })

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
    console.log(
      `received message from ${payload.key}: ${payload.msg.toString()}`,
    )
  })

  // Send message to Alice
  bob.pss.sendAsym(key, topic, 'hello world')
}

run().catch(console.error)
```

## Communication between two nodes without encryption

```javascript
import { SwarmClient } from '@erebos/swarm-node'

const run = async () => {
  // Create PSS clients over WebSocket
  const alice = new SwarmClient({ pss: 'ws://localhost:8501' })
  const bob = new SwarmClient({ pss: 'ws://localhost:8502' })

  // Retrieve Alice's node address and create the topic
  const [address, topic] = await Promise.all([
    alice.pss.baseAddr(),
    alice.pss.stringToTopic('PSS rocks'),
  ])

  // Make Alice subscribe to the created topic
  const subscription = await alice.pss.subscribeTopic(topic, true)

  // Actually subscribe to the messages stream
  alice.pss.createSubscription(subscription).subscribe(payload => {
    console.log(`received message: ${payload.msg.toString()}`)
  })

  // Send message to Alice
  bob.pss.sendRaw(address, topic, 'hello world')
}

run().catch(console.error)
```
