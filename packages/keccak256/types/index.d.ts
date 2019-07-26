/// <reference types="node" />
import { hexValue } from '@erebos/hex';
export declare function hash(value: Array<number> | Buffer): Array<number>;
export declare function pubKeyToAddress(pubKey: hexValue | Array<number> | Buffer): hexValue;
