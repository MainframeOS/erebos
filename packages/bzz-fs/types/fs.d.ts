/// <reference types="node" />
export declare function getSize(path: string): Promise<number>;
export declare function isFile(path: string): Promise<boolean>;
export declare function writeStreamTo(stream: NodeJS.ReadableStream, filePath: string): Promise<void>;
export declare function extractTarStreamTo(stream: NodeJS.ReadableStream, dirPath: string): Promise<number>;
