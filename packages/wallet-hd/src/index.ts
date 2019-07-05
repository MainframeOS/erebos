import { createKeyPair, sign } from '@erebos/secp256k1'
import { Wallet, providers, utils } from 'ethers'

const BASE_PATH = `m/44'/60'/0'/0/`

export type Arrayish = utils.Arrayish
export type TransactionRequest = providers.TransactionRequest

export class HDWallet {
  private mnemonicString: string
  protected walletsRecord: Record<string, Wallet> = {}

  public static createRandom(): HDWallet {
    const entropy = utils.randomBytes(16)
    const mnemonic = utils.HDNode.entropyToMnemonic(entropy)
    return new HDWallet(mnemonic)
  }

  public constructor(mnemonic: string, activeIndexes: Array<number> = [0]) {
    this.mnemonicString = mnemonic
    activeIndexes.forEach(i => {
      const wallet = Wallet.fromMnemonic(mnemonic, BASE_PATH + i)
      this.walletsRecord[String(i)] = wallet
    })
  }

  // Getters

  public get mnemonic(): string {
    return this.mnemonicString
  }

  public get wallets(): Array<Wallet> {
    return Object.values(this.walletsRecord)
  }

  public get accounts(): Array<string> {
    return this.wallets.map(w => w.address)
  }

  public getAccountWallet(address: string): Wallet | void {
    return this.wallets.find(
      w => w.address.toLowerCase() === address.toLowerCase(),
    )
  }

  // Account Management

  public addAccount(index: number | string): Wallet {
    const indexStr = String(index)
    if (this.walletsRecord[indexStr]) {
      return this.walletsRecord[indexStr]
    }
    const wallet = Wallet.fromMnemonic(
      this.mnemonicString,
      BASE_PATH + indexStr,
    )
    this.walletsRecord[indexStr] = wallet
    return wallet
  }

  public discardAccount(index: number | string): void {
    delete this.walletsRecord[String(index)]
  }

  // Signing

  public async signTransaction({
    from,
    ...params
  }: TransactionRequest): Promise<string> {
    const wallet = this.getAccountWallet(from as string)
    if (!wallet) {
      throw new Error(`Wallet not found for account ${from}`)
    }
    return await wallet.sign(params)
  }

  public async signMessage(
    address: string,
    message: Arrayish,
  ): Promise<string> {
    const wallet = this.getAccountWallet(address)
    if (!wallet) {
      throw new Error(`Wallet not found for account ${address}`)
    }
    return await wallet.signMessage(message)
  }

  public signBytes(address: string, bytes: Array<number>): Array<number> {
    const wallet = this.getAccountWallet(address)
    if (!wallet) {
      throw new Error(`Wallet not found for account ${address}`)
    }
    return sign(bytes, createKeyPair(wallet.privateKey.substr(2)))
  }
}
