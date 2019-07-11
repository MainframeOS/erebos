---
title: Feeds examples
---

[File storage APIs reference (contains feeds APIs)](api-bzz.md)

## Publishing a website with a permanent URL

```javascript
import { Bzz } from '@erebos/api-bzz-node'
import { pubKeyToAddress } from '@erebos/keccak256'
import { createKeyPair, sign } from '@erebos/secp256k1'

const BZZ_URL = 'http://localhost:8500'

// This setup is meant for demonstration purpose only - keys and signatures security must be handled by the application
const keyPair = createKeyPair()
const user = pubKeyToAddress(keyPair.getPublic('array'))
const signBytes = async bytes => sign(bytes, keyPair)
const bzz = new Bzz({ url: BZZ_URL, signBytes })

// website will be accessible with the URL `${BZZ_URL}/bzz:/${feedHash}`
const feedHash = await bzz.createFeedManifest({
  user,
  name: 'my-awesome-website',
})

// This function can be called any time the website contents change
const publishContents = async contents => {
  // uploadFeedValue() uploads the given contents and updates the feed to point to the contents hash
  await bzz.uploadFeedValue(feedHash, contents, { defaultPath: 'index.html' })
}

// Example use of publishContents()
const setupContents = async () => {
  await publishContents({
    'index.html': { contentType: 'text/html', data: '<h1>Hello world</h1>' },
  })
}
```

## Asynchronous messaging

The [Timeline examples page](timeline-examples.md) provides an example of asynchronous messaging with Swarm feeds, using the [Timeline protocol](timeline-spec.md).
