import { FeedParams } from '@erebos/bzz-feed';
import { DataListReader } from '@erebos/feed-list';
import { Doc } from 'automerge';
import { Bzz, DataContent, MetaContent } from './types';
export declare function downloadMeta<B extends Bzz = Bzz>(bzzFeed: B, feed: FeedParams): Promise<MetaContent>;
export declare function uploadMeta<B extends Bzz = Bzz>(bzzFeed: B, feed: FeedParams, content: MetaContent): Promise<string>;
export declare function downloadSnapshot<T, B extends Bzz = Bzz>(bzzFeed: B, hash: string): Promise<Doc<T>>;
export declare function downloadDoc<T, B extends Bzz = Bzz>(bzzFeed: B, feed: FeedParams, list: DataListReader<DataContent, B>): Promise<Doc<T>>;
