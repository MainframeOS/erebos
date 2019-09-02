---
title: Electron transport
---

## Purpose

[Electron IPC](https://electronjs.org/docs/api/ipc-renderer) transport as a [RxJS `Subject`](https://rxjs.dev/api/index/class/Subject).

## Installation

```sh
npm install @erebos/transport-electron
```

## Usage

```javascript
import { createTransport } from '@erebos/transport-electron'

const transport = createTransport('optional-channel-name')

transport.subcribe({
  next: message => {
    console.log(message)
  },
})
transport.next({ hello: 'transport' })
```

## API

### createTransport()

**Arguments**

1.  `channel?: ?string`, defaults to `rpc-message`

**Returns** `Rx.Subject<Object>`
