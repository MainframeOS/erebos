/**
 * @jest-environment node
 */

// import ganache from 'ganache-core'
import ganache from 'ganache-cli'
import httpRPC from '@mainframe/rpc-http-node'
import Eth from '../packages/api-eth'

describe('api-eth, set up ganache server once for all tests', () => {
  const server = ganache.server()
  const ganacheOptions = server.ganacheProvider.options
  const rpc = httpRPC('http://127.0.0.1:9000')
  const eth = new Eth(rpc)

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

  it('number of accounts is correct', async () => {
    const accounts = await eth.accounts()
    expect(accounts).toHaveLength(ganacheOptions.total_accounts)
  })

  it('blockNumber is correct', async () => {
    // NOTE: this returns `0x00` using ganache-cli, `3` using ganache-core
    const blockNumber = await eth.blockNumber()
    expect(blockNumber).toEqual('0x00')
  })

  it('getBalance works correctly', async () => {
    const blockNumber = await eth.blockNumber()
    const accounts = await eth.accounts()
    const address = accounts[0]
    const expectedBalance = Math.pow(ganacheOptions.default_balance_ether, 10) // 100 ETH

    const balance = await eth.getBalance(address, blockNumber)
    expect(parseInt(balance, 16)).toEqual(expectedBalance)
  })

  it('getStorageAt works correctly', async () => {
    // NOTE: this returns `0x00` using ganache-cli, `0x0` using ganache-core
    const blockNumber = await eth.blockNumber()
    const accounts = await eth.accounts()
    const address = accounts[0]

    const storage = await eth.getStorageAt(address, '0x0', blockNumber)
    expect(storage).toEqual('0x00')
  })

  it('getTransactionCount works correctly', async () => {
    const blockNumber = await eth.blockNumber()
    const accounts = await eth.accounts()
    const address = accounts[0]

    const transactionCount = await eth.getTransactionCount(address, blockNumber)
    expect(transactionCount).toEqual('0x0')
  })

  it('getBlockTransactionCountByHash works correctly', async () => {
    const accounts = await eth.accounts()
    const address = accounts[0]

    const BlockTransactionCount = await eth.getBlockTransactionCountByHash(address)
    expect(BlockTransactionCount).toEqual(0)
  })

  it('getBlockTransactionCountByHash works correctly', async () => {
    const BlockTransactionCount = await eth.getBlockTransactionCountByNumber('0x0')
    expect(BlockTransactionCount).toEqual(0)
  })

  xit('getUncleCountByBlockHash works correctly', async () => {
    // NOTE: method eth_getUncleCountByBlockHash is not supported in ganache-cli 6.1.8
    const accounts = await eth.accounts()
    const address = accounts[0]

    const uncleCount = await eth.getUncleCountByBlockHash(address)
    expect(uncleCount).toEqual(0)
  })

  xit('getUncleCountByBlockNumber works correctly', async () => {
    // NOTE: method eth_getUncleCountByBlockNumber is not supported in ganache-cli 6.1.8
    const uncleCount = await eth.getUncleCountByBlockNumber('0x0')
    expect(uncleCount).toEqual(0)
  })

  it('getCode works correctly', async () => {
    const accounts = await eth.accounts()
    const address = accounts[0]

    const code = await eth.getCode(address, '0x0')
    expect(code).toEqual('0x0')
  })

  it('sign works correctly', async () => {
    const address = '0xd1ade25ccd3d550a7eb532ac759cac7be09c2719"'
    const message = 'Schoolbus'

    const signedData = await eth.sign(address, message)
    console.log(signedData, 'signedData')
  })

  it('sendTransaction - with only required params', async () => {
    const accounts = await eth.accounts()
    const from = accounts[0]
    const transactionHash = await eth.sendTransaction({ from })

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
    const transactionHash = await eth.sendTransaction({ from, to, gas, value })

    const transaction = await eth.getTransactionByHash(transactionHash)
    expect(transaction.from).toEqual(from)
    expect(transaction.to).toEqual(to)
    expect(transaction.gas).toEqual(`0x${gas.toString(16)}`)
    expect(transaction.value).toEqual(`0x0${value.toString(16)}`)
    expect(transaction.input).toEqual('0x0')
  })

  it('sendTransaction fails with insufficient gas', async () => {
    const accounts = await eth.accounts()
    await expect(
      eth.sendTransaction({
        from: accounts[0],
        to: accounts[1],
        gas: 10,
        value: 200000000000000000, // 0.2 ETH
      }),
    ).rejects.toThrow('base fee exceeds gas limit')
  })
})

describe('api-eth, reset ganache server before each test', () => {
  let server
  let ganacheOptions
  const rpc = httpRPC('http://127.0.0.1:9000')
  const eth = new Eth(rpc)

  beforeEach(() => {
    server = ganache.server()
    server.listen(9000)
    ganacheOptions = server.ganacheProvider.options
  })

  afterEach(() => {
    server.close()
  })

  xit('test scenario', async () => {
    // TODO
  })
})
