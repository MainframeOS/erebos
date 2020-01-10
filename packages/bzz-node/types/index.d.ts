/// <reference types="node" />
import { Bzz, BzzConfig, DirectoryData, DownloadOptions, UploadOptions } from '@erebos/bzz';
import FormData from 'form-data';
import { Response } from 'node-fetch';
export * from '@erebos/bzz';
export declare class BzzNode extends Bzz<NodeJS.ReadableStream, Response, FormData> {
    constructor(config: BzzConfig<Response>);
    downloadDirectory(hash: string, options?: DownloadOptions): Promise<DirectoryData>;
    uploadDirectory(directory: DirectoryData, options?: UploadOptions): Promise<string>;
}
