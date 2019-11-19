/// <reference types="node" />
import { Readable } from 'stream';
import { BaseBzz, BzzConfig, DirectoryData, DownloadOptions, UploadOptions } from '@erebos/api-bzz-base';
import { hexValue } from '@erebos/hex';
import { Response } from 'node-fetch';
export * from '@erebos/api-bzz-base';
export declare class Bzz extends BaseBzz<Response, Readable> {
    constructor(config: BzzConfig);
    protected normalizeStream(stream: NodeJS.ReadableStream): Readable;
    downloadTarTo(hash: string, toPath: string, options?: DownloadOptions): Promise<void>;
    downloadFileTo(hash: string, toPath: string, options?: DownloadOptions): Promise<void>;
    downloadDirectoryTo(hash: string, toPath: string, options?: DownloadOptions): Promise<number>;
    downloadTo(hash: string, toPath: string, options?: DownloadOptions): Promise<void>;
    uploadDirectory(directory: DirectoryData, options?: UploadOptions): Promise<hexValue>;
    uploadFileStream(stream: Readable, options?: UploadOptions): Promise<hexValue>;
    uploadFileFrom(path: string, options?: UploadOptions): Promise<hexValue>;
    private uploadTarStream;
    uploadTar(path: string, options?: UploadOptions): Promise<hexValue>;
    uploadDirectoryFrom(path: string, options?: UploadOptions): Promise<hexValue>;
    uploadFrom(path: string, options?: UploadOptions): Promise<hexValue>;
}
