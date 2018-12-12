import BaseBzz, { DirectoryData, UploadOptions } from '@erebos/api-bzz-base'
import { hexValue } from '@erebos/hex'

export default class Bzz extends BaseBzz<Response> {
  uploadDirectory(
    directory: DirectoryData,
    options?: UploadOptions,
    headers?: Object,
  ): Promise<hexValue>
}
