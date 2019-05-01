// @flow

import { Wallet, utils, type Arrayish } from 'ethers'

type TransactionParams = {
  from: string,
  to?: string,
  value?: string,
  data?: string,
  gasLimit: string,
  gasPrice: string,
  chainId?: string,
}

const BASE_PATH = `m/44'/60'/0'/0/`

export default class HDWallet {
  _mnemonic: string
  _name: ?string
  _wallets: { [index: string]: Wallet } = {}

  static createRandom = (name?: string) => {
    const entropy = utils.randomBytes(16)
    const mnemonic = utils.HDNode.entropyToMnemonic(entropy)
    return new HDWallet(mnemonic, name)
  }

  constructor(
    mnemonic: string,
    name?: string,
    activeIndexes?: Array<string> = ['0'],
  ) {
    this._mnemonic = mnemonic
    this._name = name
    activeIndexes.forEach(i => {
      const wallet = Wallet.fromMnemonic(mnemonic, BASE_PATH + String(i))
      this._wallets[i] = wallet
    })
  }

  // Getters

  get name(): ?string {
    return this._name
  }

  get wallets(): Array<Wallet> {
    return Object.keys(this._wallets).map(i => this._wallets[i])
  }

  get accounts(): Array<string> {
    return this.wallets.map(w => w.address)
  }

  getAccountWallet(address: string) {
    return this.wallets.find(
      w => w.address.toLowerCase() === address.toLowerCase(),
    )
  }

  // Account Management

  addAccount(index: number | string): Wallet {
    const indexStr = String(index)
    if (this._wallets[indexStr]) {
      return this._wallets[indexStr]
    }
    const wallet = Wallet.fromMnemonic(this._mnemonic, BASE_PATH + indexStr)
    this._wallets[indexStr] = wallet
    return wallet
  }

  discardAccount(index: number | string) {
    const indexStr = String(index)
    if (this._wallets[indexStr]) {
      delete this._wallets[indexStr]
    }
  }

  // Signing

  signTransaction(txParams: TransactionParams): Promise<string> {
    const wallet = this.getAccountWallet(txParams.from)
    if (!wallet) {
      throw new Error(`Wallet not found for account ${txParams.from}`)
    }
    delete txParams['from']
    return wallet.sign(txParams)
  }

  signMessage(address: string, message: string | Arrayish): Promise<string> {
    const wallet = this.getAccountWallet(address)
    if (!wallet) {
      throw new Error(`Wallet not found for account ${address}`)
    }
    return wallet.signMessage(message)
  }
}
