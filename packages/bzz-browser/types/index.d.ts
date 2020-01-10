import { Bzz, DirectoryData, DownloadOptions, UploadOptions, Response } from '@erebos/bzz';
export * from '@erebos/bzz';
declare type Readable = ReadableStream<Uint8Array>;
export declare class BzzBrowser extends Bzz<Readable, Response<Readable>, FormData> {
    downloadDirectory(hash: string, options?: DownloadOptions): Promise<DirectoryData>;
    uploadDirectory(directory: DirectoryData, options?: UploadOptions): Promise<string>;
}
