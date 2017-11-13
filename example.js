const {
  base64ToArray,
  base64ToHex,
  createPSSWebSocket,
  decodeMessage,
  encodeMessage,
} = require('./lib')

const run = async () => {
  // Open WebSocket connections
  const [alice, bob] = await Promise.all([
    createPSSWebSocket('ws://localhost:8501'),
    createPSSWebSocket('ws://localhost:8502'),
  ])
  // Retrieve Alice's public key and create the topic
  const [key, topic] = await Promise.all([
    alice.getPublicKey(),
    alice.stringToTopic('PSS rocks'),
  ])
  // Make Alice subscribe to the created topic and Bob add her public key
  const [subscription] = await Promise.all([
    alice.subscribeTopic(topic),
    bob.setPeerPublicKey(base64ToArray(key), topic),
  ])
  // Actually subscribe to the messages stream
  alice.createSubscription(subscription).subscribe(payload => {
    const msg = decodeMessage(payload.Msg)
    console.log(`received message from ${payload.Key}: ${msg}`)
  })
  // Send message to Alice
  bob.sendAsym(base64ToHex(key), topic, encodeMessage('hello world'))
}

run().catch(console.error)
