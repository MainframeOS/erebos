/// <reference types="node" />
import { Readable } from 'stream';
export declare function getSize(path: string): Promise<number>;
export declare function isFile(path: string): Promise<boolean>;
export declare function writeStreamTo(stream: Readable, filePath: string): Promise<void>;
export declare function extractTarStreamTo(stream: Readable, dirPath: string): Promise<number>;
