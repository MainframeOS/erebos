import { FeedParams } from '@erebos/api-bzz-base';
import { DataListReader } from '@erebos/feed-list';
import { Doc } from 'automerge';
import { BzzInstance, DataContent, MetaContent } from './types';
export declare function downloadMeta<Bzz extends BzzInstance = BzzInstance>(bzz: Bzz, feed: FeedParams): Promise<MetaContent>;
export declare function uploadMeta<Bzz extends BzzInstance = BzzInstance>(bzz: Bzz, feed: FeedParams, content: MetaContent): Promise<string>;
export declare function downloadSnapshot<T, Bzz extends BzzInstance = BzzInstance>(bzz: Bzz, hash: string): Promise<Doc<T>>;
export declare function downloadDoc<T, Bzz extends BzzInstance = BzzInstance>(bzz: Bzz, feed: FeedParams, list: DataListReader<DataContent, Bzz>): Promise<Doc<T>>;
