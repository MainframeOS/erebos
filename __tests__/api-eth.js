/**
 * @jest-environment node
 */

import ganache from 'ganache-cli'
import httpRPC from '@mainframe/rpc-http-node'
import Eth from '../packages/api-eth'

describe('api-eth', () => {
  const server = ganache.server()
  const rpc = httpRPC('http://127.0.0.1:9000')
  const eth = new Eth(rpc)
  const ganacheOptions = server.ganacheProvider.options

  beforeAll(() => {
    server.listen(9000)
  })

  afterAll(() => {
    server.close()
  })

  it('protocolVersion is correct', async () => {
    const protocolVersion = await eth.protocolVersion()
    expect(protocolVersion).toEqual('63')
  })

  it('syncing returns a boolean', async () => {
    const syncing = await eth.syncing()
    expect(typeof syncing === 'boolean').toBeTruthy()
  })

  it('mining returns a boolean', async () => {
    const mining = await eth.mining()
    expect(typeof mining === 'boolean').toBeTruthy()
  })

  it('hashrate is correct', async () => {
    const hashrate = await eth.hashrate()
    expect(hashrate).toEqual('0x0')
  })

  it('gasPrice is correct', async () => {
    const gasPrice = await eth.gasPrice()
    expect(gasPrice).toEqual(ganacheOptions.gasPrice)
  })

  it('number of accounts', async () => {
    const accounts = await eth.accounts()
    expect(accounts).toHaveLength(ganacheOptions.total_accounts)
  })

  it('coinbase is the first account', async () => {
    const accounts = await eth.accounts()
    const coinbase = await eth.coinbase()
    expect(coinbase).toEqual(accounts[0])
  })
})
