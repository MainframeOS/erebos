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

  it('sendTransaction - with only required params', async () => {
    const accounts = await eth.accounts()
    const from = accounts[0]
    const transactionHash = await eth.sendTransaction({from})

    const transaction = await eth.getTransactionByHash(transactionHash)
    expect(transaction.from).toEqual(from)
    expect(transaction.to).toEqual('0x0')
    expect(transaction.value).toEqual('0x0')
    expect(transaction.input).toEqual('0x0')
  })

  it('sendTransaction - with multiple params', async () => {
    const accounts = await eth.accounts()
    const from = accounts[0]
    const to = accounts[1]
    const value = 200000000000000000 // 0.2 ETH
    const gas = 22000
    const transactionHash = await eth.sendTransaction({from, to, gas, value})

    const transaction = await eth.getTransactionByHash(transactionHash)
    expect(transaction.from).toEqual(from)
    expect(transaction.to).toEqual(to)
    expect(transaction.gas).toEqual(`0x${gas.toString(16)}`)
    expect(transaction.value).toEqual(`0x0${value.toString(16)}`)
    expect(transaction.input).toEqual('0x0')
  })

  it('sendTransaction fails with insufficient gas', async () => {
    const accounts = await eth.accounts()
    const from = accounts[0]
    const to = accounts[1]
    const value = 200000000000000000 // 0.2 ETH
    const gas = 10
    const transactionHash = await eth.sendTransaction({from, to, gas, value})

    expect(eth.getTransactionByHash(transactionHash)).rejects.toThrow('Must be implemented in extending class')
  })
})
