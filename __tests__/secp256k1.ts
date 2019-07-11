import {
  createKeyPair,
  createPublic,
  sign,
  verify,
} from '../packages/secp256k1'

describe('secp256k1', () => {
  it('createKeyPair() creates a new key pair or uses the provided privake key', () => {
    const kp1 = createKeyPair()
    const kp2 = createKeyPair(kp1.getPrivate('hex'))
    expect(kp1.getPublic('hex')).toBe(kp2.getPublic('hex'))
  })

  it('createPublic() returns the public key point', () => {
    const kp = createKeyPair()
    const pubHex = kp.getPublic('hex')
    const pubPoint = createPublic(pubHex).getPublic()
    expect(pubPoint.encode('hex')).toBe(pubHex)
  })

  it('sign() signs the provided data using the private key', () => {
    const kp = createKeyPair(
      '453b9ca3f51d413c86c9b8b0c6d7507c4162825f9e99e9d6ad79d0f25a2f7823',
    )
    const input = Buffer.from('test')
    const signed = sign(Array.from(input), kp.getPrivate().toBuffer())
    expect(Buffer.from(signed).toString('hex')).toBe(
      'f878d09a8522ff7bb5eba1c9e2fa6697804829bed55011ebcf6dba20d4ad6da4288829c10135f3a35ca1e7f3a0f41f7ffa17c73d7d31deafe674d8885256beb000',
    )
  })

  it('verify() verifies a signature', () => {
    const kp = createKeyPair(
      '453b9ca3f51d413c86c9b8b0c6d7507c4162825f9e99e9d6ad79d0f25a2f7823',
    )
    const input = Buffer.from('test')
    const signature = sign(Array.from(input), kp)
    const pubHex = kp.getPublic('hex')
    const verifiedHex = verify(input, signature, pubHex)
    expect(verifiedHex).toBe(true)
    const verifiedKey = verify(input, signature, createPublic(pubHex))
    expect(verifiedKey).toBe(true)
  })
})
