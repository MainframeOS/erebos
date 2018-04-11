const { Client, decodeHex, encodeHex } = require('../lib')

const run = async () => {
  // Create PSS clients over WebSocket
  const client1 = new Client('ws://localhost:8501')
  const alice = client1.pss
  const client2 = new Client('ws://localhost:8502')
  const bob = client2.pss

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
    const msg = decodeHex(payload.Msg)
    console.log(`received message from ${payload.Key}: ${msg}`)
  })

  // Send message to Alice
  bob.sendAsym(key, topic, encodeHex('hello world'))
}

run().catch(console.error)
