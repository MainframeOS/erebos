// @flow

import Bzz from '@erebos/api-bzz-node'
import { pubKeyToAddress } from '@erebos/keccak256'
import { createKeyPair, sign } from '@erebos/secp256k1'

import { Feedlinks } from '.'

const sleep = (time: number) => new Promise(r => setTimeout(r, time))

async function run() {
  const keyPair = createKeyPair(
    '0c0e0cb66e2e87b764bc4f5745f0d23fe0b9488fd48964900117e9a858f18546',
    'hex',
  )
  const address = pubKeyToAddress(keyPair.getPublic().encode())
  const bzz = new Bzz({
    signFeedDigest: async digest => sign(digest, keyPair.getPrivate()),
    url: 'http://localhost:8500',
  })
  const feedLinks = new Feedlinks(bzz)

  const feedHash =
    '52403f4a66d12f9fa45433bf47c620fbdb0702bf6df75c54a8e7f18222829ca7'
  const updater = await feedLinks.createUpdater(feedHash, {
    author: address,
  })

  await updater({ content: 'update2' })

  const start = Date.now()
  const subscription = feedLinks
    .live(feedHash, { interval: 10000 })
    .subscribe(async payload => {
      console.log(
        'feed update',
        Math.floor((Date.now() - start) / 1000),
        payload.content,
      )
    })

  // await sleep(1000)
  // await updater({ content: 'update2' })
  // await sleep(1000)
  // await updater({ content: 'update3' })
  // await sleep(1000)
  // await updater({ content: 'update4' })
  // await sleep(3000)
  // await updater({ content: 'update5' })
  // await sleep(2000)
  // await updater({ content: 'update6' })
  // await sleep(3000)
  // await updater({ content: 'update7' })
  // await sleep(2000)
  // await updater({ content: 'update8' })
}

run().catch(console.error)
