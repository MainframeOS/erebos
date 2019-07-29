import { utils } from 'ethers'

import { Bzz } from '../packages/api-bzz-node'
import { HDWallet } from '../packages/wallet-hd'

const MNEMONIC =
  'roof kind control velvet proud attack rose hour episode impulse venture manage'

const FIRST_ACCOUNT = '0x81468a3c97E8603AB159da136D32Cce141fbB8BA'

describe('HDWallet', () => {
  it('creates a new wallet from mnemonic phrase', () => {
    const wallet = new HDWallet(MNEMONIC)
    expect(wallet.accounts[0]).toBe(FIRST_ACCOUNT)
  })

  it('creates a wallet from a random mnemonic', async () => {
    const wallet = HDWallet.createRandom()
    expect(wallet.accounts.length).toBe(1)
  })

  it('adds a new wallet account by index', () => {
    const wallet = new HDWallet(MNEMONIC)
    wallet.addAccount(1)
    expect(wallet.accounts[1]).toBe(
      '0x5A8C1279A13edDae37A979d0B3602f29ea14f636',
    )
  })

  it('returns existing wallet if adding from existing index', () => {
    const wallet = new HDWallet(MNEMONIC)
    wallet.addAccount(0)
    expect(wallet.accounts.length).toBe(1)
  })

  it('removes an account by index', () => {
    const wallet = new HDWallet(MNEMONIC)
    wallet.addAccount(1)
    expect(wallet.accounts.length).toBe(2)
    wallet.discardAccount(1)
    expect(wallet.accounts.length).toBe(1)
    expect(wallet.accounts[0]).toBe(FIRST_ACCOUNT)
  })

  it('returns a wallet account from provided address', () => {
    const wallet = new HDWallet(MNEMONIC)
    const walletAccount = wallet.getAccountWallet(FIRST_ACCOUNT)
    expect(walletAccount.address).toBe(FIRST_ACCOUNT)
  })

  it('signs a message with an accounts private key', async () => {
    const wallet = new HDWallet(MNEMONIC)
    const signed = await wallet.signMessage(FIRST_ACCOUNT, 'test')
    expect(signed).toBe(
      '0x9e4faec5d8b59bc0f6b3121b9c74cd5c9074cdca41d6b6f37bf8faa5931d99124c00485104aa0b9971c43d6f4c754e4af0ea67993e5044a167f50c6174314c2a1c',
    )
  })

  it('signs a transaction with an accounts private key', async () => {
    const wallet = new HDWallet(MNEMONIC)
    const signed = await wallet.signTransaction({
      from: FIRST_ACCOUNT,
      to: '0xd46e8dd67c5d32be8058bb8eb970870f07244567',
      gasLimit: '0x76c0', // 30400
      gasPrice: '0x9184e72a000', // 10000000000000
      value: '0x9184e72a', // 2441406250
      data:
        '0xd46e8dd67c5d32be8d46e8dd67c5d32be8058bb8eb970870f072445675058bb8eb970870f072445675',
    })
    expect(signed).toBe(
      '0xf892808609184e72a0008276c094d46e8dd67c5d32be8058bb8eb970870f07244567849184e72aa9d46e8dd67c5d32be8d46e8dd67c5d32be8058bb8eb970870f072445675058bb8eb970870f0724456751ca0ff758a8502ca0dfff2de4a9ca49ef9a5d329265c524da9b19d417a985bfcaa12a0518ce8da5ac37d21e6b4b682c3c7e6cbbc7c08a993c1af71bf7771fc5ebebcf0',
    )
  })

  it('signs bytes with an accounts private key', () => {
    const wallet = new HDWallet(MNEMONIC)
    const bytes = Buffer.from('test', 'utf8')
    const signedBytes = wallet.signBytes(FIRST_ACCOUNT, bytes)
    const hex = utils.hexlify(signedBytes)
    expect(hex).toBe(
      '0x6740fad7598944a2a35eb0297ce22ab45981ddbc295e3fbdbb1aeb98bd7bd850474a696ffdcc1e7e98276f2116e4b5c0dd17d28b2250c7f6bf384cb5ab5f0b9801',
    )
  })

  it('supports signing feeds', async () => {
    const wallet = new HDWallet(MNEMONIC)
    const params = { user: FIRST_ACCOUNT, name: 'test' }
    const data = { test: 'test' }
    const bzz = new Bzz({
      signBytes: async bytes => wallet.signBytes(FIRST_ACCOUNT, bytes),
      url: 'http://localhost:8500',
    })
    await bzz.setFeedChunk(params, data)
    const res = await bzz.getFeedChunk(params)
    const value = await res.json()
    expect(value).toEqual(data)
  })
})
