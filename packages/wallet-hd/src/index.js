// @flow

import { sign } from '@erebos/secp256k1'
import { Wallet, utils, type Arrayish } from 'ethers'

export type TransactionParams = {
  from: string,
  to?: string,
  value?: string,
  data?: string,
  gasLimit: string,
  gasPrice: string,
  chainId?: string,
}

const BASE_PATH = `m/44'/60'/0'/0/`

export class HDWallet {
  _mnemonic: string
  _wallets: { [index: string]: Wallet } = {}

  static createRandom = () => {
    const entropy = utils.randomBytes(16)
    const mnemonic = utils.HDNode.entropyToMnemonic(entropy)
    return new HDWallet(mnemonic)
  }

  constructor(mnemonic: string, activeIndexes?: Array<number> = [0]) {
    this._mnemonic = mnemonic
    activeIndexes.forEach(i => {
      const wallet = Wallet.fromMnemonic(mnemonic, BASE_PATH + i)
      this._wallets[String(i)] = wallet
    })
  }

  // Getters

  get mnemonic(): string {
    return this._mnemonic
  }

  get wallets(): Array<Wallet> {
    return Object.values(this._wallets)
  }

  get accounts(): Array<string> {
    return this.wallets.map(w => w.address)
  }

  getAccountWallet(address: string): ?Wallet {
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

  discardAccount(index: number | string): void {
    const indexStr = String(index)
    if (this._wallets[indexStr]) {
      delete this._wallets[indexStr]
    }
  }

  // Signing

  async signTransaction({
    from,
    ...params
  }: TransactionParams): Promise<string> {
    const wallet = this.getAccountWallet(from)
    if (!wallet) {
      throw new Error(`Wallet not found for account ${from}`)
    }
    return await wallet.sign(params)
  }

  async signMessage(
    address: string,
    message: string | Arrayish,
  ): Promise<string> {
    const wallet = this.getAccountWallet(address)
    if (!wallet) {
      throw new Error(`Wallet not found for account ${address}`)
    }
    return await wallet.signMessage(message)
  }

  signBytes(address: string, bytes: Array<number>): Array<number> {
    const wallet = this.getAccountWallet(address)
    if (!wallet) {
      throw new Error(`Wallet not found for account ${address}`)
    }
    const key = wallet.privateKey.substr(2)
    return sign(bytes, key)
  }
}
