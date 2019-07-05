/// <reference types="node" />
import elliptic from 'elliptic';
export declare type KeyPair = elliptic.ec.KeyPair;
export declare type Signature = {
    r: Buffer;
    s: Buffer;
} | {
    r: string;
    s: string;
};
export declare const ec: elliptic.ec;
export declare function createKeyPair(privKey?: string): KeyPair;
export declare function createPublic(pubKey: string): KeyPair;
export declare function sign(bytes: Array<number>, privKey: KeyPair | Buffer): Array<number>;
export declare function verify(bytes: Array<number>, signature: Array<number> | Signature, pubKey: string | KeyPair): boolean;
