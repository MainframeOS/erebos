import { Hex, hexInput, hexValue } from '@erebos/hex';
import { StreamRPC } from '@erebos/rpc-stream';
import { Observable } from 'rxjs';
export declare const EMPTY_ADDRESS: hexValue;
export interface PssEvent {
    key?: hexValue;
    msg: Hex;
}
export declare class Pss {
    protected rpc: StreamRPC;
    constructor(rpc: StreamRPC);
    baseAddr(): Promise<hexValue>;
    getPublicKey(): Promise<hexValue>;
    sendAsym(key: hexValue, topic: hexValue, message: Hex | hexInput): Promise<null>;
    sendSym(keyID: string, topic: hexValue, message: Hex | hexInput): Promise<null>;
    sendRaw(address: hexValue, topic: hexValue, message: Hex | hexInput): Promise<null>;
    setPeerPublicKey(key: hexValue, topic: hexValue, address: hexValue): Promise<null>;
    setSymmetricKey(key: hexValue, topic: hexValue, address: hexValue, useForDecryption?: boolean): Promise<string>;
    stringToTopic(str: string): Promise<hexValue>;
    subscribeTopic(topic: hexValue, handleRawMessages?: boolean): Promise<hexValue>;
    createSubscription(subscription: hexValue): Observable<PssEvent>;
    createTopicSubscription(topic: hexValue, handleRawMessages?: boolean): Promise<Observable<PssEvent>>;
}
