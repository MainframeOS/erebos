---
title: HTTP transport
---

## Purpose

HTTP transport for browser or Node.

## Installation

### For browser

```sh
npm install @erebos/transport-http-browser
```

### For Node

```sh
npm install @erebos/transport-http-node
```

## Usage

```javascript
import { createTransport } from '@erebos/transport-http-browser'

const request = createTransport('http://localhost')

request({ hello: 'transport' }).then(console.log)
```

## API

### createTransport()

**Arguments**

1.  `url: string`

**Returns** `(data: any) => Promise<any>`
