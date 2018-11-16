/**
 * @jest-environment node
 */

// import ganache from 'ganache-core'
import ganache from 'ganache-cli'
import httpRPC from '@mainframe/rpc-http-node'
import Eth from '../packages/api-eth'
import fromHexValue from '../packages/hex'

describe('api-eth, set up ganache server once for all tests', () => {
  const server = ganache.server()
  const ganacheOptions = server.ganacheProvider.options
  const rpc = httpRPC('http://127.0.0.1:8545')
  const eth = new Eth(rpc)

  beforeAll(() => {
    server.listen(9000)
  })

  afterAll(() => {
    server.close()
  })

  it('protocolVersion is correct', async () => {
    const protocolVersion = await eth.protocolVersion()
    console.log(protocolVersion, 'protocolVersion')
    console.log(fromHexValue(protocolVersion).toString(), 'Hex')
    // console.log(Hex.toString(protocolVersion), 'Hex')
    // expect(protocolVersion).toEqual('63')
  })

  xit('syncing returns a boolean', async () => {
    const syncing = await eth.syncing()
    expect(typeof syncing === 'boolean').toBeTruthy()
  })

  xit('mining returns a boolean', async () => {
    const mining = await eth.mining()
    expect(typeof mining === 'boolean').toBeTruthy()
  })

  xit('hashrate is correct', async () => {
    const hashrate = await eth.hashrate()
    expect(hashrate).toEqual('0x0')
  })

  xit('gasPrice is correct', async () => {
    const gasPrice = await eth.gasPrice()
    expect(gasPrice).toEqual(ganacheOptions.gasPrice)
  })

  xit('number of accounts is correct', async () => {
    const accounts = await eth.accounts()
    expect(accounts).toHaveLength(ganacheOptions.total_accounts)
  })

  xit('blockNumber is correct', async () => {
    // NOTE: this returns `0x00` using ganache-cli, `3` using ganache-core
    const blockNumber = await eth.blockNumber()
    expect(blockNumber).toEqual('0x00')
  })

  xit('getBalance works correctly', async () => {
    const blockNumber = await eth.blockNumber()
    const accounts = await eth.accounts()
    const address = accounts[0]
    const expectedBalance = Math.pow(ganacheOptions.default_balance_ether, 10) // 100 ETH

    const balance = await eth.getBalance(address, blockNumber)
    expect(parseInt(balance, 16)).toEqual(expectedBalance)
  })

  xit('getStorageAt works correctly', async () => {
    // NOTE: this returns `0x00` using ganache-cli, `0x0` using ganache-core
    const blockNumber = await eth.blockNumber()
    const accounts = await eth.accounts()
    const address = accounts[0]

    const storage = await eth.getStorageAt(address, '0x0', blockNumber)
    expect(storage).toEqual('0x00')
  })

  xit('getTransactionCount works correctly', async () => {
    const blockNumber = await eth.blockNumber()
    const accounts = await eth.accounts()
    const address = accounts[0]

    const transactionCount = await eth.getTransactionCount(address, blockNumber)
    expect(transactionCount).toEqual('0x0')
  })

  xit('getBlockTransactionCountByHash works correctly', async () => {
    const accounts = await eth.accounts()
    const address = accounts[0]

    const BlockTransactionCount = await eth.getBlockTransactionCountByHash(address)
    expect(BlockTransactionCount).toEqual(0)
  })

  xit('getBlockTransactionCountByHash works correctly', async () => {
    const blockTransactionCount = await eth.getBlockTransactionCountByNumber('0x0')
    expect(blockTransactionCount).toEqual(0)
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

  xit('getCode works correctly', async () => {
    const accounts = await eth.accounts()
    const address = accounts[0]

    const code = await eth.getCode(address, '0x0')
    expect(code).toEqual('0x0')
  })

  xit('sign works correctly', async () => {
    // NOTE: method eth_sign is not supported in ganache-cli 6.1.8
    const expectedData = '0x2ac19db245478a06032e69cdbd2b54e648b78431d0a47bd1fbab18f79f820ba407466e37adbe9e84541cab97ab7d290f4a64a5825c876d22109f3bf813254e8601'
    const address = '0xd1ade25ccd3d550a7eb532ac759cac7be09c2719"'
    const message = 'Schoolbus'

    const signedData = await eth.sign(address, message)
    expected(signedData).toEqual(expectedData)
  })

  xit('sendTransaction - with only required params', async () => {
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

  xit('sendTransaction fails with insufficient gas', async () => {
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
