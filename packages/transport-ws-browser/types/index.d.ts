import { WebSocketSubject } from 'rxjs/webSocket';
export declare function createTransport<T = any>(url: string): WebSocketSubject<T>;
