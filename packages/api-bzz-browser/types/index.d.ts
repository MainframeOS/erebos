import { BzzBase, BzzConfig, DirectoryData, UploadOptions } from '@erebos/api-bzz-base';
import { hexValue } from '@erebos/hex';
export * from '@erebos/api-bzz-base';
export declare class BzzBrowser extends BzzBase<Response> {
    constructor(config: BzzConfig);
    uploadDirectory(directory: DirectoryData, options?: UploadOptions): Promise<hexValue>;
}
