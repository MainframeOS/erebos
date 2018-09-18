// @flow

export type DirectoryData = {
  [path: string]: { data: string | Buffer, contentType: string, size?: number },
}

export type FileEntry = {
  data: string | Buffer,
  path: string,
  size?: number,
}

export type ListEntry = {
  hash: string,
  path: string,
  contentType: string,
  size: number,
  mod_time: string,
}

export type ListResult = {
  common_prefixes?: Array<string>,
  entries?: Array<ListEntry>,
}

export type BzzMode = 'default' | 'immutable' | 'raw'

export type SharedOptions = {
  contentType?: string,
  path?: string,
}

export type DownloadOptions = SharedOptions & {
  mode?: BzzMode,
}

export type UploadOptions = SharedOptions & {
  defaultPath?: string,
  encrypt?: boolean,
  manifestHash?: string,
}

export const BZZ_MODE_PROTOCOLS = {
  default: 'bzz:/',
  immutable: 'bzz-immutable:/',
  raw: 'bzz-raw:/',
}

export const getModeProtocol = (mode?: ?BzzMode): string => {
  return (mode && BZZ_MODE_PROTOCOLS[mode]) || BZZ_MODE_PROTOCOLS.default
}

export class HTTPError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

export const resOrError = (res: *) => {
  return res.ok
    ? Promise.resolve(res)
    : Promise.reject(new HTTPError(res.status, res.statusText))
}

export const resJSON = (res: *) => resOrError(res).then(r => r.json())

export const resText = (res: *) => resOrError(res).then(r => r.text())

export default class BaseBzz {
  _fetch: *
  _url: string

  constructor(url: string) {
    this._url = new URL(url).toString()
  }

  _getDownloadURL(
    hash: string,
    options: DownloadOptions,
    raw?: boolean = false,
  ): string {
    const protocol = raw
      ? BZZ_MODE_PROTOCOLS.raw
      : getModeProtocol(options.mode)
    let url = this._url + protocol + hash
    if (options.path != null) {
      url += `/${options.path}`
    }
    if (options.mode === 'raw' && options.contentType != null) {
      url += `?content_type=${options.contentType}`
    }
    return url
  }

  _getUploadURL(options: UploadOptions, raw?: boolean = false): string {
    // Default URL to creation
    let url = this._url + BZZ_MODE_PROTOCOLS[raw ? 'raw' : 'default']
    // Manifest update if hash is provided
    if (options.manifestHash != null) {
      url += `${options.manifestHash}/`
      if (options.path != null) {
        url += options.path
      }
    }
    return url
  }

  hash(domain: string): Promise<string> {
    return this._fetch(`${this._url}bzz-hash:/${domain}`).then(resText)
  }

  list(hash: string, options?: DownloadOptions = {}): Promise<ListResult> {
    let url = `${this._url}bzz-list:/${hash}`
    if (options.path != null) {
      url += `/${options.path}`
    }
    return this._fetch(url).then(resJSON)
  }

  _download(
    hash: string,
    options: DownloadOptions,
    headers?: Object = {},
  ): Promise<*> {
    const url = this._getDownloadURL(hash, options)
    return this._fetch(url, { headers }).then(resOrError)
  }

  download(hash: string, options?: DownloadOptions = {}): Promise<*> {
    return this._download(hash, options)
  }

  _upload(
    body: mixed,
    options: UploadOptions,
    headers?: Object = {},
    raw?: boolean = false,
  ): Promise<string> {
    const url = this._getUploadURL(options, raw)
    return this._fetch(url, { body, headers, method: 'POST' }).then(resText)
  }

  uploadFile(
    data: string | Buffer,
    options?: UploadOptions = {},
  ): Promise<string> {
    const body = typeof data === 'string' ? Buffer.from(data) : data
    const raw = options.contentType == null
    const headers: Object = { 'content-length': body.length }
    if (!raw) {
      headers['content-type'] = options.contentType
    }
    return this._upload(body, options, headers, raw)
  }

  uploadDirectory(
    _directory: DirectoryData,
    _options?: UploadOptions,
  ): Promise<string> {
    return Promise.reject(new Error('Must be implemented in extending class'))
  }

  upload(
    data: string | Buffer | DirectoryData,
    options?: UploadOptions = {},
  ): Promise<string> {
    return typeof data === 'string' || Buffer.isBuffer(data)
      ? // $FlowFixMe: Flow doesn't understand type refinement with Buffer check
        this.uploadFile(data, options)
      : this.uploadDirectory(data, options)
  }

  deleteResource(hash: string, path: string): Promise<string> {
    const url = this._getUploadURL({ manifestHash: hash, path })
    return this._fetch(url, { method: 'DELETE' }).then(resText)
  }
}
