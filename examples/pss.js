const { PssAPI, createRPC } = require('../packages/swarm')

const run = async () => {
  // Create PSS clients over WebSocket
  const alice = new PssAPI(createRPC('ws://127.0.0.1:8501'))
  const bob = new PssAPI(createRPC('ws://127.0.0.1:8502'))

  // Retrieve Alice's public key and create the topic
  const [key, topic] = await Promise.all([
    alice.getPublicKey(),
    alice.stringToTopic('PSS rocks'),
  ])

  // Make Alice subscribe to the created topic and Bob add her public key
  const [subscription] = await Promise.all([
    alice.subscribeTopic(topic),
    bob.setPeerPublicKey(key, topic),
  ])

  // Actually subscribe to the messages stream
  alice.createSubscription(subscription).subscribe(payload => {
    console.log(
      `received message from ${payload.key}: ${payload.msg.toString()}`,
    )
  })

  // Send message to Alice
  bob.sendAsym(key, topic, 'hello world')
}

run().catch(console.error)
