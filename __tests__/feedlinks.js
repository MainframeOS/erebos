import Bzz from '../packages/api-bzz-node'
import Feedlinks from '../packages/feedlinks'

describe('feedlinks', () => {
  it('creates a Feelinks instance', () => {
    const bzz = new Bzz({ url: 'http://localhost:8500' })
    const feed = new Feedlinks({ bzz })
    expect(feed instanceof Feedlinks).toBe(true)
  })
})
