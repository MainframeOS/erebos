/// <reference types="node" />
import { BaseBzz, BzzConfig, DirectoryData, UploadOptions } from '@erebos/api-bzz-base';
import { hexValue } from '@erebos/hex';
import { Readable } from 'readable-stream';
export * from '@erebos/api-bzz-base';
export declare class Bzz extends BaseBzz<Response, Readable> {
    constructor(config: BzzConfig);
    protected normalizeStream(stream: ReadableStream): Readable;
    protected uploadBody(body: Buffer | FormData | Readable, options: UploadOptions, raw?: boolean): Promise<hexValue>;
    uploadDirectory(directory: DirectoryData, options?: UploadOptions): Promise<hexValue>;
}
