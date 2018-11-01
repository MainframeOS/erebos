import createHex, { Hex } from '../packages/hex'

describe('hex', () => {
  it('accepts an hex value', () => {
    const val = '0x' + Buffer.from('test').toString('hex')
    const hex = createHex(val)
    expect(hex instanceof Hex).toBe(true)
    expect(hex._input).toEqual({ type: 'hex', value: val })
  })

  it('accepts a Buffer value', () => {
    const buffer = Buffer.from('hello')
    const hex = createHex(buffer)
    expect(hex instanceof Hex).toBe(true)
    expect(hex._input).toEqual({ type: 'buffer', value: buffer })
  })

  it('accepts an Object value', () => {
    const obj = { hello: 'test' }
    const hex = createHex(obj)
    expect(hex instanceof Hex).toBe(true)
    expect(hex._input).toEqual({ type: 'object', value: obj })
  })

  it('accepts a string value', () => {
    const str = 'hello world'
    const hex = createHex(str)
    expect(hex instanceof Hex).toBe(true)
    expect(hex._input).toEqual({ type: 'string', value: str })
  })

  it('accepts an Hex instance', () => {
    const str = 'hello world'
    const hex = createHex(str)
    const otherHex = createHex(hex)
    expect(otherHex instanceof Hex).toBe(true)
    expect(otherHex).toBe(hex)
  })

  it('provides an hex value from any accepted input', () => {
    // hex value
    const val = '0x' + Buffer.from('test').toString('hex')
    expect(createHex(val).value).toBe(val)
    // Buffer
    expect(createHex(Buffer.from('hello')).value).toBe(
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
    // from string
    expect(Buffer.from('hello').equals(createHex('hello').toBuffer())).toBe(
      true,
    )
    // from Object
    const obj = { hello: 'test' }
    expect(
      Buffer.from(JSON.stringify(obj)).equals(createHex(obj).toBuffer()),
    ).toBe(true)
    // from number (default unhandled value)
    expect(Buffer.alloc(0).equals(createHex(1).toBuffer())).toBe(true)
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
    // from string
    expect(createHex(JSON.stringify(data)).toObject()).toEqual(data)
    // from Object
    expect(createHex(data).toObject()).toEqual(data)
    // from number (default unhandled value)
    expect(createHex(1).toObject()).toEqual({})
  })

  it('exposes a toString() method', () => {
    // from hex
    const hex = createHex('0x' + Buffer.from('test').toString('hex'))
    expect(hex.toString()).toBe('test')
    // from buffer
    const buffer = Buffer.from('test')
    expect(createHex(buffer).toString()).toBe('test')
    // from string
    expect(createHex('test').toString()).toBe('test')
    // from Object
    expect(createHex({ hello: 'world' }).toString()).toBe('{"hello":"world"}')
    // from number (default unhandled value)
    expect(createHex(1).toString()).toBe('')
  })
})
