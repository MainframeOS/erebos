import { Wallet, providers, utils } from 'ethers';
export declare type Arrayish = utils.Arrayish;
export declare type TransactionRequest = providers.TransactionRequest;
export declare class HDWallet {
    private mnemonicString;
    protected walletsRecord: Record<string, Wallet>;
    static createRandom(): HDWallet;
    constructor(mnemonic: string, activeIndexes?: Array<number>);
    readonly mnemonic: string;
    readonly wallets: Array<Wallet>;
    readonly accounts: Array<string>;
    getAccountWallet(address: string): Wallet | void;
    addAccount(index: number | string): Wallet;
    discardAccount(index: number | string): void;
    signTransaction({ from, ...params }: TransactionRequest): Promise<string>;
    signMessage(address: string, message: Arrayish): Promise<string>;
    signBytes(address: string, bytes: Array<number>): Array<number>;
}
