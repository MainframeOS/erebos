/// <reference types="node" />
import { Bzz, DirectoryData, Response, UploadOptions } from '@erebos/bzz';
export * from '@erebos/bzz';
export declare class BzzReactNative extends Bzz<NodeJS.ReadableStream, Response, FormData> {
    uploadDirectory(directory: DirectoryData, options?: UploadOptions): Promise<string>;
}
