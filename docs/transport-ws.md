---
title: WebSocket transport
---

## Purpose

WebSocket transport for browser or Node as a [RxJS `Subject`](https://rxjs.dev/api/index/class/Subject).

## Installation

### For browser

```sh
npm install @erebos/transport-ws-browser
```

### For Node

```sh
npm install @erebos/transport-ws-node
```

## Usage

```javascript
import { createTransport } from '@erebos/transport-ws-browser'

const transport = createTransport('ws://localhost')

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
