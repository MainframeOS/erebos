import { Config, SocketSubject } from 'rx-socket';
export declare type PathOrConfig = string | Config;
export declare function createTransport<T = any>(pathOrConfig: PathOrConfig): SocketSubject<T>;
