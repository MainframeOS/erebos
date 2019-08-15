# transport-http-browser

HTTP transport for browser.

## Installation

```sh
yarn add @erebos/transport-http-browser
```

## Usage

```js
import httpTransport from '@erebos/transport-http-browser'

const transport = httpTransport('http://localhost')

transport.request({ hello: 'transport' }).then(console.log)
```

## API

### httpTransport()

**Arguments**

1.  `url: string`

**Returns** `(data: Object) => Promise<any>`

## License

MIT
