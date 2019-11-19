import { Readable, ReadableOptions } from 'readable-stream';
export declare class NodeReadable extends Readable {
    private _webStream;
    private _reader;
    private _reading;
    private _doneReading?;
    constructor(webStream: ReadableStream, options?: ReadableOptions);
    _read(): void;
    _destroy(err: Error | null, callback: (err: Error | null | undefined) => void): void;
    _handleDestroy(err: Error | null, callback: (err: Error | null | undefined) => void): void;
}
