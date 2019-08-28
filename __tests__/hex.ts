import { Hex, createHex } from '@erebos/hex'

describe('hex', () => {
  it('accepts an hex value', () => {
    const val = '0x' + Buffer.from('test').toString('hex')
    const hex = createHex(val)
    expect(hex instanceof Hex).toBe(true)
    expect(hex.equals(val)).toBe(true)
    expect(hex.input).toEqual({ type: 'hex', value: val })
  })

  it('accepts a Buffer value', () => {
    const buffer = Buffer.from('hello')
    const hex = createHex(buffer)
    expect(hex instanceof Hex).toBe(true)
    expect(hex.equals(buffer)).toBe(true)
    expect(hex.input).toEqual({ type: 'buffer', value: buffer })
  })

  it('accepts a bytes Array value', () => {
    const bytes = [0, 128, 192]
    const hex = createHex(bytes)
    expect(hex instanceof Hex).toBe(true)
    expect(hex.equals(bytes)).toBe(true)
    expect(hex.input).toEqual({ type: 'bytesArray', value: bytes })
  })

  it('accepts an Object value', () => {
    const obj = { hello: 'test' }
    const hex = createHex(obj)
    expect(hex instanceof Hex).toBe(true)
    expect(hex.equals(obj)).toBe(true)
    expect(hex.input).toEqual({ type: 'object', value: obj })
  })

  it('accepts a string value', () => {
    const str = 'hello world'
    const hex = createHex(str)
    expect(hex instanceof Hex).toBe(true)
    expect(hex.equals(str)).toBe(true)
    expect(hex.input).toEqual({ type: 'string', value: str })
  })

  it('accepts an Hex instance', () => {
    const str = 'hello world'
    const hex = createHex(str)
    const otherHex = createHex(hex)
    expect(otherHex instanceof Hex).toBe(true)
    expect(otherHex).toBe(hex)
  })

  it('compares by hex value using the equals() method', () => {
    const data = { hello: 'world' }
    const str = JSON.stringify(data)
    const buffer = Buffer.from(str)
    const bytes = Array.from(buffer)
    const fromData = createHex(data)
    const fromString = createHex(str)
    const fromBuffer = createHex(buffer)
    const fromBytes = createHex(bytes)
    const fromHex = createHex('0x' + buffer.toString('hex'))
    expect(fromData.equals(fromString)).toBe(true)
    expect(fromString.equals(fromBuffer)).toBe(true)
    expect(fromBuffer.equals(fromBytes)).toBe(true)
    expect(fromBytes.equals(fromHex)).toBe(true)
  })

  it('throws when the input is invalid', () => {
    expect(() => void createHex(0)).toThrow('Invalid input')
  })

  it('provides an hex value from any accepted input', () => {
    // hex value
    const val = '0x' + Buffer.from('test').toString('hex')
    expect(createHex(val).value).toBe(val)
    // Buffer
    expect(createHex(Buffer.from('hello')).value).toBe(
      '0x' + Buffer.from('hello').toString('hex'),
    )
    // Bytes Array
    expect(createHex(Array.from(Buffer.from('hello'))).value).toBe(
      '0x' + Buffer.from('hello').toString('hex'),
    )
    // Object
    expect(createHex({ hello: 'test' }).value).toBe(
      '0x' + Buffer.from(JSON.stringify({ hello: 'test' })).toString('hex'),
    )
    // string
    expect(createHex('test').value).toBe(
      '0x' + Buffer.from('test').toString('hex'),
    )
  })

  it('exposes a toBuffer() method', () => {
    // from hex
    const hex = createHex('0x' + Buffer.from('test').toString('hex'))
    expect(Buffer.from('test').equals(hex.toBuffer())).toBe(true)
    // from buffer
    const buffer = Buffer.from('test')
    expect(createHex(buffer).toBuffer()).toBe(buffer)
    // from bytes array
    expect(buffer.equals(createHex([116, 101, 115, 116]).toBuffer())).toBe(true)
    // from string
    expect(buffer.equals(createHex('test').toBuffer())).toBe(true)
    // from Object
    const obj = { hello: 'test' }
    expect(
      Buffer.from(JSON.stringify(obj)).equals(createHex(obj).toBuffer()),
    ).toBe(true)
  })

  it('exposes a toBytesArray() method', () => {
    const bytes = [116, 101, 115, 116]
    // from hex
    const hex = createHex('0x' + Buffer.from('test').toString('hex'))
    expect(hex.toBytesArray()).toEqual(bytes)
    // from buffer
    expect(createHex(Buffer.from('test')).toBytesArray()).toEqual(bytes)
    // from bytes array
    expect(createHex(bytes).toBytesArray()).toEqual(bytes)
    // from string
    expect(createHex('test').toBytesArray()).toEqual(bytes)
    // from Object
    const obj = { hello: 'test' }
    expect(createHex(obj).toBytesArray()).toEqual(
      Array.from(Buffer.from(JSON.stringify(obj))),
    )
  })

  it('exposes a toObject() method', () => {
    const data = { hello: 'world' }
    // from hex
    const hex = createHex(
      '0x' + Buffer.from(JSON.stringify(data)).toString('hex'),
    )
    expect(hex.toObject()).toEqual(data)
    // from buffer
    const buffer = Buffer.from(JSON.stringify(data))
    expect(createHex(buffer).toObject()).toEqual(data)
    // from bytes array
    expect(createHex(Array.from(buffer)).toObject()).toEqual(data)
    // from string
    expect(createHex(JSON.stringify(data)).toObject()).toEqual(data)
    // from Object
    expect(createHex(data).toObject()).toEqual(data)
  })

  it('exposes a toString() method', () => {
    // from hex
    const hex = createHex('0x' + Buffer.from('test').toString('hex'))
    expect(hex.toString()).toBe('test')
    // from buffer
    const buffer = Buffer.from('test')
    expect(createHex(buffer).toString()).toBe('test')
    // from bytes array
    expect(createHex([116, 101, 115, 116]).toString()).toBe('test')
    // from string
    expect(createHex('test').toString()).toBe('test')
    // from Object
    expect(createHex({ hello: 'world' }).toString()).toBe('{"hello":"world"}')
  })
})
