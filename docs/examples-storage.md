---
title: File storage examples
---

[File storage APIs reference](bzz.md)

## Using the standalone browser library

```html
<html>
  <script src="https://unpkg.com/@erebos/swarm-browser/dist/erebos.swarm.production.js"></script>
  <script>
    const client = new Erebos.swarm.SwarmClient({
      http: 'https://swarm-gateways.net',
    })
    client.bzz
      .uploadFile('Hello world!', { contentType: 'text/plain' })
      .then(hash => client.bzz.download(hash))
      .then(res => res.text())
      .then(text => {
        console.log(text) // "Hello world!"
      })
  </script>
</html>
```

## Using a local Swarm node

```javascript
import path from 'path'
import { BzzFS } from '@erebos/bzz-fs'
import { BzzNode } from '@erebos/bzz-node'

const bzz = new BzzNode({ url: 'http://localhost:8500' })
const bzzFS = new BzzFS({ basePath: __dirname, bzz })

bzzFS
  .uploadDirectoryFrom('my-files')
  .then(hash => bzz.list(hash))
  .then(contents => {
    console.log(contents) // Manifest contents describing the uploaded files
  })
```
