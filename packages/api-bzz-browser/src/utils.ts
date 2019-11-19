import { Readable, ReadableOptions } from 'readable-stream'

// Taken from https://github.com/JCCR/web-streams-node
// License: https://github.com/jccr/web-streams-node/blob/master/LICENSE

export class NodeReadable extends Readable {
  private _webStream: ReadableStream
  private _reader: ReadableStreamDefaultReader<any>
  private _reading: boolean
  private _doneReading?: (value?: unknown) => void

  constructor(webStream: ReadableStream, options?: ReadableOptions) {
    super(options)
    this._webStream = webStream
    this._reader = webStream.getReader()
    this._reading = false
    this._doneReading = undefined
  }

  _read(): void {
    if (this._reading) {
      return
    }
    this._reading = true
    const doRead = (): void => {
      this._reader.read().then(res => {
        if (this._doneReading) {
          this._reading = false
          this._reader.releaseLock()
          this._doneReading()
        }
        if (res.done) {
          this.push(null)
          this._reading = false
          this._reader.releaseLock()
          return
        }
        if (this.push(res.value)) {
          return doRead()
        } else {
          this._reading = false
          this._reader.releaseLock()
        }
      })
    }
    doRead()
  }

  _destroy(
    err: Error | null,
    callback: (err: Error | null | undefined) => void,
  ): void {
    if (this._reading) {
      const promise = new Promise(resolve => {
        this._doneReading = resolve
      })
      promise.then(() => this._handleDestroy(err, callback))
    } else {
      this._handleDestroy(err, callback)
    }
  }

  _handleDestroy(
    err: Error | null,
    callback: (err: Error | null | undefined) => void,
  ): void {
    this._webStream.cancel()
    super._destroy(err, callback)
  }
}
