/// <reference types="node" />
declare enum HexValue {
    _ = ""
}
export declare type hexValue = HexValue & string;
export declare type hexInput = hexValue | string | Record<string, any> | Buffer | Array<number>;
export declare function isHexValue(value: any): value is hexValue;
export declare function fromHexValue(input: hexValue): Buffer;
export declare function toHexValue(value: Buffer | string | ArrayBuffer | Array<number> | Uint8Array): hexValue;
declare type HexInput = {
    type: 'buffer';
    value: Buffer;
} | {
    type: 'bytesArray';
    value: Array<number>;
} | {
    type: 'hex';
    value: hexValue;
} | {
    type: 'object';
    value: Record<string, any>;
} | {
    type: 'string';
    value: string;
};
export declare class Hex {
    static from(input: hexInput | Hex): Hex;
    protected input: HexInput;
    protected hexValue: hexValue;
    constructor(inputValue: hexInput | Hex);
    get value(): hexValue;
    equals(other: hexInput | Hex): boolean;
    toBuffer(): Buffer;
    toBytesArray(): Array<number>;
    toObject<T = Record<string, any>>(): T;
    toString(): string;
}
export {};
