import { Hex } from '@erebos/hex'

describe('hex', () => {
  it('accepts an hex value', () => {
    const val = '0x' + Buffer.from('test').toString('hex')
    const hex = Hex.from(val)
    expect(hex instanceof Hex).toBe(true)
    expect(hex.equals(val)).toBe(true)
    expect(hex.input).toEqual({ type: 'hex', value: val })
  })

  it('accepts a Buffer value', () => {
    const buffer = Buffer.from('hello')
    const hex = Hex.from(buffer)
    expect(hex instanceof Hex).toBe(true)
    expect(hex.equals(buffer)).toBe(true)
    expect(hex.input).toEqual({ type: 'buffer', value: buffer })
  })

  it('accepts a bytes Array value', () => {
    const bytes = [0, 128, 192]
    const hex = Hex.from(bytes)
    expect(hex instanceof Hex).toBe(true)
    expect(hex.equals(bytes)).toBe(true)
    expect(hex.input).toEqual({ type: 'bytesArray', value: bytes })
  })

  it('accepts an Object value', () => {
    const obj = { hello: 'test' }
    const hex = Hex.from(obj)
    expect(hex instanceof Hex).toBe(true)
    expect(hex.equals(obj)).toBe(true)
    expect(hex.input).toEqual({ type: 'object', value: obj })
  })

  it('accepts a string value', () => {
    const str = 'hello world'
    const hex = Hex.from(str)
    expect(hex instanceof Hex).toBe(true)
    expect(hex.equals(str)).toBe(true)
    expect(hex.input).toEqual({ type: 'string', value: str })
  })

  it('accepts an Hex instance', () => {
    const str = 'hello world'
    const hex = Hex.from(str)
    const otherHex = Hex.from(hex)
    expect(otherHex instanceof Hex).toBe(true)
    expect(otherHex).toBe(hex)
  })

  it('compares by hex value using the equals() method', () => {
    const data = { hello: 'world' }
    const str = JSON.stringify(data)
    const buffer = Buffer.from(str)
    const bytes = Array.from(buffer)
    const fromData = Hex.from(data)
    const fromString = Hex.from(str)
    const fromBuffer = Hex.from(buffer)
    const fromBytes = Hex.from(bytes)
    const fromHex = Hex.from('0x' + buffer.toString('hex'))
    expect(fromData.equals(fromString)).toBe(true)
    expect(fromString.equals(fromBuffer)).toBe(true)
    expect(fromBuffer.equals(fromBytes)).toBe(true)
    expect(fromBytes.equals(fromHex)).toBe(true)
  })

  it('throws when the input is invalid', () => {
    expect(() => void Hex.from(0)).toThrow('Invalid input')
  })

  it('provides an hex value from any accepted input', () => {
    // hex value
    const val = '0x' + Buffer.from('test').toString('hex')
    expect(Hex.from(val).value).toBe(val)
    // Buffer
    expect(Hex.from(Buffer.from('hello')).value).toBe(
      '0x' + Buffer.from('hello').toString('hex'),
    )
    // Bytes Array
    expect(Hex.from(Array.from(Buffer.from('hello'))).value).toBe(
      '0x' + Buffer.from('hello').toString('hex'),
    )
    // Object
    expect(Hex.from({ hello: 'test' }).value).toBe(
      '0x' + Buffer.from(JSON.stringify({ hello: 'test' })).toString('hex'),
    )
    // string
    expect(Hex.from('test').value).toBe(
      '0x' + Buffer.from('test').toString('hex'),
    )
  })

  it('exposes a toBuffer() method', () => {
    // from hex
    const hex = Hex.from('0x' + Buffer.from('test').toString('hex'))
    expect(Buffer.from('test').equals(hex.toBuffer())).toBe(true)
    // from buffer
    const buffer = Buffer.from('test')
    expect(Hex.from(buffer).toBuffer()).toBe(buffer)
    // from bytes array
    expect(buffer.equals(Hex.from([116, 101, 115, 116]).toBuffer())).toBe(true)
    // from string
    expect(buffer.equals(Hex.from('test').toBuffer())).toBe(true)
    // from Object
    const obj = { hello: 'test' }
    expect(
      Buffer.from(JSON.stringify(obj)).equals(Hex.from(obj).toBuffer()),
    ).toBe(true)
  })

  it('exposes a toBytesArray() method', () => {
    const bytes = [116, 101, 115, 116]
    // from hex
    const hex = Hex.from('0x' + Buffer.from('test').toString('hex'))
    expect(hex.toBytesArray()).toEqual(bytes)
    // from buffer
    expect(Hex.from(Buffer.from('test')).toBytesArray()).toEqual(bytes)
    // from bytes array
    expect(Hex.from(bytes).toBytesArray()).toEqual(bytes)
    // from string
    expect(Hex.from('test').toBytesArray()).toEqual(bytes)
    // from Object
    const obj = { hello: 'test' }
    expect(Hex.from(obj).toBytesArray()).toEqual(
      Array.from(Buffer.from(JSON.stringify(obj))),
    )
  })

  it('exposes a toObject() method', () => {
    const data = { hello: 'world' }
    // from hex
    const hex = Hex.from(
      '0x' + Buffer.from(JSON.stringify(data)).toString('hex'),
    )
    expect(hex.toObject()).toEqual(data)
    // from buffer
    const buffer = Buffer.from(JSON.stringify(data))
    expect(Hex.from(buffer).toObject()).toEqual(data)
    // from bytes array
    expect(Hex.from(Array.from(buffer)).toObject()).toEqual(data)
    // from string
    expect(Hex.from(JSON.stringify(data)).toObject()).toEqual(data)
    // from Object
    expect(Hex.from(data).toObject()).toEqual(data)
  })

  it('exposes a toString() method', () => {
    // from hex
    const hex = Hex.from('0x' + Buffer.from('test').toString('hex'))
    expect(hex.toString()).toBe('test')
    // from buffer
    const buffer = Buffer.from('test')
    expect(Hex.from(buffer).toString()).toBe('test')
    // from bytes array
    expect(Hex.from([116, 101, 115, 116]).toString()).toBe('test')
    // from string
    expect(Hex.from('test').toString()).toBe('test')
    // from Object
    expect(Hex.from({ hello: 'world' }).toString()).toBe('{"hello":"world"}')
  })
})
