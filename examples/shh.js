const { Client, decodeHex, encodeHex } = require('../packages/erebos')

const sleep = time => new Promise(resolve => setTimeout(resolve, time))

const run = async () => {
  // Connect to the server over HTTP
  const { shh } = new Client('http://localhost:8545')

  // Get Alice's and Bob's keys
  const [aliceKeyID, bobKeyID] = await Promise.all([
    shh.newKeyPair(),
    shh.newKeyPair(),
  ])
  const [alicePubKey, bobPubKey] = await Promise.all([
    shh.getPublicKey(aliceKeyID),
    shh.getPublicKey(bobKeyID),
  ])

  // Create a message filter for messages from Alice to Bob
  const filter = await shh.newMessageFilter({
    sig: alicePubKey,
    privateKeyID: bobKeyID,
    allowP2P: true,
  })

  // Post a message from Alice to Bob
  const sent = await shh.post({
    pubKey: bobPubKey,
    sig: aliceKeyID,
    payload: encodeHex('hello Bob'),
    ttl: 300,
    powTarget: 0.2,
    powTime: 100,
  })
  console.log('message sent to Bob?', sent)

  // Wait a bit to make sure the call to retrieve messages will return a value
  await sleep(300)

  // Retrieve messages using created filter
  const messages = await shh.getFilterMessages(filter)
  messages.forEach(msg => {
    console.log('received message from Alice:', decodeHex(msg.payload))
  })
}

run().catch(console.error)
