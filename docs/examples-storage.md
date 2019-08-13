---
title: File storage examples
---

[File storage APIs reference](api-bzz.md)

## Using the standalone browser library

```html
<html>
  <script src="https://unpkg.com/@erebos/swarm-browser/dist/erebos.swarm.production.js"></script>
  <script>
    const client = new Erebos.swarm.SwarmClient({
      http: 'https://swarm-gateways.net',
    })
    client.bzz
      .upload('Hello world!', { contentType: 'text/plain' })
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
import { SwarmClient } from '@erebos/swarm-node'

const client = new SwarmClient({ bzz: { url: 'http://localhost:8500' } })

client.bzz
  .uploadDirectoryFrom(path.join(__dirname, 'my-files'))
  .then(hash => client.bzz.list(hash))
  .then(contents => {
    console.log(contents) // Manifest contents describing the uploaded files
  })
```
