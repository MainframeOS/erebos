/// <reference types="node" />
import elliptic from 'elliptic';
export declare type BNInput = elliptic.BNInput;
export declare type KeyPair = elliptic.ec.KeyPair;
export declare const ec: elliptic.ec;
export declare function createKeyPair(privKey?: string): KeyPair;
export declare function createPublic(pubKey: string): KeyPair;
export declare function sign(input: BNInput, privKey: KeyPair | Buffer): Array<number>;
export declare function verify(input: BNInput, signature: Array<number> | elliptic.ec.SignatureOptions, pubKey: string | KeyPair | Buffer): boolean;
