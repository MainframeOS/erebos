import { BzzNode, DownloadOptions, UploadOptions } from '@erebos/bzz-node';
export * from './fs';
export interface BzzFSConfig {
    basePath?: string;
    bzz: BzzNode | string;
}
export declare class BzzFS {
    readonly bzz: BzzNode;
    readonly resolvePath: (path: string) => string;
    constructor(config: BzzFSConfig);
    downloadTarTo(hash: string, toPath: string, options?: DownloadOptions): Promise<void>;
    downloadFileTo(hash: string, toPath: string, options?: DownloadOptions): Promise<void>;
    downloadDirectoryTo(hash: string, toPath: string, options?: DownloadOptions): Promise<number>;
    downloadTo(hash: string, toPath: string, options?: DownloadOptions): Promise<void>;
    uploadFileFrom(fromPath: string, options?: UploadOptions): Promise<string>;
    private uploadTarStream;
    uploadTar(fromPath: string, options?: UploadOptions): Promise<string>;
    uploadDirectoryFrom(fromPath: string, options?: UploadOptions): Promise<string>;
    uploadFrom(fromPath: string, options?: UploadOptions): Promise<string>;
}
