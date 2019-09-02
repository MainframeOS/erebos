---
title: IPC transport
---

## Purpose

[IPC](https://nodejs.org/dist/latest-v10.x/docs/api/net.html#net_ipc_support) transport for Node as a [RxJS `Subject`](https://rxjs.dev/api/index/class/Subject).

## Installation

```sh
npm install @erebos/transport-ipc
```

## Usage

```javascript
import { createTransport } from '@erebos/transport-ipc'

const transport = createTransport('/path/to/socket')

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

1.  `url: string`

**Returns** `Rx.Subject<Object>`
