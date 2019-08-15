import { BaseRPC } from '@erebos/rpc-base'

describe('rpc-base', () => {
  it('has a canSubscribe getter depending on constructor value', () => {
    const withSubscribe = new BaseRPC(true)
    expect(withSubscribe.canSubscribe).toBe(true)
    const withoutSubscribe = new BaseRPC()
    expect(withoutSubscribe.canSubscribe).toBe(false)
  })

  it('has a createID() method generating a random string', () => {
    const rpc = new BaseRPC()
    const id1 = rpc.createID()
    const id2 = rpc.createID()
    expect(typeof id1).toBe('string')
    expect(id1).not.toBe(id2)
  })
})
