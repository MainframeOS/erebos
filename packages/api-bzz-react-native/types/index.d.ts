import * as stream from 'readable-stream';
import { BaseBzz, BzzConfig, DirectoryData, UploadOptions } from '@erebos/api-bzz-base';
import { hexValue } from '@erebos/hex';
export * from '@erebos/api-bzz-base';
export declare class Bzz extends BaseBzz<Response, stream.Readable> {
    constructor(config: BzzConfig);
    uploadDirectory(directory: DirectoryData, options?: UploadOptions): Promise<hexValue>;
}
