import { FeedParams } from '@erebos/bzz-feed';
import { DataListReader, DataListWriter } from '@erebos/feed-list';
import { Doc } from 'automerge';
import { Bzz, DataContent, DataPayload, MetaContent, MetaPayload, ProtocolContent } from './types';
export declare const PROTOCOL = "docsync";
export declare const VERSION = "1.0.0";
export declare function validateProtocol<T extends ProtocolContent>(content: T): T;
export declare function uploadData<B extends Bzz = Bzz>(list: DataListWriter<DataPayload, B>, content: DataContent): Promise<void>;
export declare function downloadMeta<B extends Bzz = Bzz>(bzzFeed: B, feed: FeedParams): Promise<MetaPayload>;
export declare function uploadMeta<B extends Bzz = Bzz>(bzzFeed: B, feed: FeedParams, content: MetaContent): Promise<string>;
export declare function downloadSnapshot<T, B extends Bzz = Bzz>(bzzFeed: B, hash: string): Promise<Doc<T>>;
export declare function uploadSnapshot<T, B extends Bzz = Bzz>(bzzFeed: B, doc: Doc<T>): Promise<string>;
export declare function downloadDoc<T, B extends Bzz = Bzz>(bzzFeed: B, feed: FeedParams, list: DataListReader<DataPayload, B>): Promise<Doc<T>>;