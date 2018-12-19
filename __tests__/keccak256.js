import { hash, pubKeyToAddress } from '../packages/keccak256'

describe('keccak256', () => {
  it('hash() hashes an input buffer', () => {
    const hashBytes = hash(Buffer.from('test'))
    expect(Buffer.from(hashBytes).toString('hex')).toBe(
      '9c22ff5f21f0b81b113e63f7db6da94fedef11b2119b4088b89664fb9a3cb658',
    )
  })

  it('pubKeyToAddress() hashes the input buffer and returns a 20-byte long buffer', () => {
    const pubKey = Buffer.from(
      '26001d76d94641fa3443a664a704c8606916d1d13f3091b12cc8e4f4629b1fbc',
      'hex',
    )
    expect(pubKeyToAddress(pubKey)).toBe(
      '0x2650af6057d350c49a7aafe86c355231c431a54c',
    )
  })
})
