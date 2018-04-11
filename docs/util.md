# Utilities

### hexType()

Casts a value to `hex` to make Flow accept it.

**Arguments**

1.  `value: any`

**Returns** `hex`.

### hexEmpty

**Returns** `0x` string with `hex` type.

### encodeHex()

**Arguments**

1.  `data: string | Array<number>`
1.  `type?: string = 'utf8'`

**Returns** `hex`.

### decodeHex()

**Arguments**

1.  `data: hex`
1.  `type?: string = 'utf8'`

**Returns** `string` encoded based on `type`.
