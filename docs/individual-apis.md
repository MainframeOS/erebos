---
title: Individual APIs
---

The [`SwarmClient` class](swarm-client.md) provides the following APIs, but they can also be used individually:

- [Bzz APIs](bzz.md) for file storage
- [Pss APIs](pss.md): Postal Services over Swarm (UDP-like messaging)

Interactions with [Swarm feeds](https://swarm-guide.readthedocs.io/en/latest/dapp_developer/index.html#feeds) are provided by the [`bzz-feed` package](bzz-feed.md) while interactions with the file system are provided by the [`bzz-fs` package](bzz-fs.md)

Additional [data structures](data-structures.md) built on top of these APIs are implemented in other packages.
