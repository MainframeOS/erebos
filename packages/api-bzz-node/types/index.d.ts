/// <reference types="node" />
import { Readable } from 'stream';
import { BaseBzz, BzzConfig, DirectoryData, DownloadOptions, UploadOptions } from '@erebos/api-bzz-base';
import { Response } from 'node-fetch';
export * from '@erebos/api-bzz-base';
export declare class Bzz extends BaseBzz<Response, Readable> {
    constructor(config: BzzConfig);
    protected normalizeStream(stream: NodeJS.ReadableStream): Readable;
    downloadTarTo(hash: string, toPath: string, options?: DownloadOptions): Promise<void>;
    downloadFileTo(hash: string, toPath: string, options?: DownloadOptions): Promise<void>;
    downloadDirectoryTo(hash: string, toPath: string, options?: DownloadOptions): Promise<number>;
    downloadTo(hash: string, toPath: string, options?: DownloadOptions): Promise<void>;
    uploadDirectory(directory: DirectoryData, options?: UploadOptions): Promise<string>;
    uploadFileFrom(path: string, options?: UploadOptions): Promise<string>;
    private uploadTarStream;
    uploadTar(path: string, options?: UploadOptions): Promise<string>;
    uploadDirectoryFrom(path: string, options?: UploadOptions): Promise<string>;
    uploadFrom(path: string, options?: UploadOptions): Promise<string>;
}
