import fetchMock from "fetch-mock"
import BaseBzz from '../packages/erebos-api-bzz-base'

const url = "https://example.com/swarm-gateways"
const bzz = new BaseBzz(url)
bzz._fetch = global.fetch
fetchMock.get('*', 'world');


describe('placeholder test', () => {
  it('should always pass', () => {
    expect(0).toBe(0)
  })
})

describe('BaseBzz', () => {
  it('download', async () => {
    var a = fetch("http://httpbin.org/get")
    console.log(await a)
    var b = bzz._fetch("http://httpbin.org/get")
    console.log(await b)
    console.log(bzz._fetch)
  })
})
