/// <reference types="node" />

import { Readable } from 'stream'
import BaseBzz, {
  DirectoryData,
  DownloadOptions,
  FileEntry,
  UploadOptions,
} from '@erebos/api-bzz-base'
import { hexValue } from '@erebos/hex'
import { Response } from 'node-fetch'
import { Observable } from 'rxjs'

export default class Bzz extends BaseBzz<Response> {
  downloadObservable(
    hash: string,
    options?: DownloadOptions,
  ): Observable<FileEntry>
  downloadDirectoryData(
    hash: string,
    options?: DownloadOptions,
  ): Promise<DirectoryData>
  downloadFileTo(
    hash: string,
    toPath: string,
    options?: DownloadOptions,
  ): Promise<void>
  downloadDirectoryTo(
    hash: string,
    toPath: string,
    options?: DownloadOptions,
  ): Promise<number>
  downloadTo(
    hash: string,
    toPath: string,
    options?: DownloadOptions,
  ): Promise<void>
  uploadDirectory(
    directory: DirectoryData,
    options?: UploadOptions,
  ): Promise<hexValue>
  uploadFileStream(stream: Readable, options?: UploadOptions): Promise<hexValue>
  uploadFileFrom(path: string, options?: UploadOptions): Promise<hexValue>
  uploadTar(path: string, options?: UploadOptions): Promise<hexValue>
  uploadDirectoryFrom(path: string, options?: UploadOptions): Promise<hexValue>
  uploadFrom(path: string, options?: UploadOptions): Promise<hexValue>
}
