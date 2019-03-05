import BN from 'bn.js'
import {
  NullCoder,
  BooleanCoder,
  SignedIntegerCoder,
} from '../packages/eth-abi'

describe('eth-abi', () => {
  it('NullCoder encodes and decodes', () => {
    const coder = new NullCoder()
    const encoded = coder.encode(null)
    expect(Buffer.alloc(0).equals(encoded)).toBe(true)
    const decoded = coder.decode(encoded)
    expect(decoded).toEqual({ consumed: 0, value: null })
  })

  it('BooleanCoder encodes and decodes', () => {
    const expected = Buffer.alloc(32)
    expected.writeUInt8(1, 31)
    const coder = new BooleanCoder()
    const encoded = coder.encode(true)
    expect(expected.equals(encoded)).toBe(true)
    const decoded = coder.decode(encoded)
    expect(decoded).toEqual({ consumed: 32, value: true })
  })

  it('SignedIntegerEncoder encodes and decodes', () => {
    // TODO: test with various numbers and hitting min/max boundaries
    const number = 1000000
    const coder = new SignedIntegerCoder(8)
    const encoded = coder.encode(new BN(number))
    const decoded = coder.decode(encoded)
    expect(decoded.consumed).toBe(32)
    expect(decoded.value.toNumber()).toBe(number)
  })
})
