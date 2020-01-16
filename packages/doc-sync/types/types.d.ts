import { Response } from '@erebos/bzz';
import { BzzFeed, FeedParams } from '@erebos/bzz-feed';
import { DataListReader, DataListWriter } from '@erebos/feed-list';
import { Change, Doc } from 'automerge';
import { DocSubscriber } from './DocSubscriber';
export declare type Bzz = BzzFeed<any, Response>;
export interface FeedFactoryParams {
    user: string;
    topic?: string;
}
export interface DataContent {
    changes: Array<Change>;
}
export interface MetaSnapshot {
    hash: string;
    time: number;
}
export interface MetaContent {
    dataFeed: FeedParams;
    snapshot?: MetaSnapshot | undefined;
}
export interface ProtocolContent {
    protocol: string;
    version: string;
}
export interface DataPayload extends DataContent, ProtocolContent {
}
export interface MetaPayload extends MetaContent, ProtocolContent {
}
export interface DocFeeds {
    data: FeedParams;
    meta: FeedParams;
}
export interface DocSerialized {
    docString: string;
    dataFeed: FeedParams;
    metaFeed: FeedParams;
}
export interface LoadDocReaderParams<B extends Bzz = Bzz> {
    bzz: B;
    feed: FeedParams;
}
export interface FromJSONDocReaderParams<B extends Bzz = Bzz> extends DocSerialized {
    bzz: B;
}
export interface DocReaderParams<T, B extends Bzz = Bzz> {
    bzz: B;
    doc: Doc<T>;
    feed: FeedParams;
    list: DataListReader<DataPayload, B>;
    time: number;
}
export interface DocSubscriberParams<T, B extends Bzz = Bzz> extends DocReaderParams<T, B> {
    pullInterval: number;
}
export interface FromJSONDocSubscriberParams<B extends Bzz = Bzz> extends FromJSONDocReaderParams<B> {
    pullInterval: number;
}
export interface LoadDocSubscriberParams<B extends Bzz = Bzz> extends LoadDocReaderParams<B> {
    pullInterval: number;
}
export interface CreateDocWriterParams<B extends Bzz = Bzz> {
    bzz: B;
    feed: FeedFactoryParams;
    snapshotFrequency?: number;
}
export interface InitDocWriterParams<T, B extends Bzz = Bzz> extends CreateDocWriterParams<B> {
    doc: T;
}
export interface FromJSONDocWriterParams<B extends Bzz = Bzz> extends FromJSONDocReaderParams<B> {
    snapshotFrequency?: number;
}
export interface LoadDocWriterParams<B extends Bzz = Bzz> extends LoadDocReaderParams<B> {
    snapshotFrequency?: number;
}
export interface DocWriterParams<T, B extends Bzz = Bzz> {
    bzz: B;
    doc: Doc<T>;
    feed: FeedParams;
    list: DataListWriter<DataPayload, B>;
    snapshotFrequency?: number;
}
export interface InitDocSynchronizerParams<T, B extends Bzz = Bzz> extends InitDocWriterParams<T, B> {
    pullInterval: number;
    pushInterval?: number;
    sources?: Array<FeedParams>;
}
export interface FromJSONDocSynchronizerParams<B extends Bzz = Bzz> extends FromJSONDocWriterParams<B> {
    pullInterval: number;
    pushInterval?: number;
    sources?: Array<DocSerialized>;
}
export interface LoadDocSynchronizerParams<B extends Bzz = Bzz> extends LoadDocWriterParams<B> {
    pullInterval: number;
    pushInterval?: number;
    sources?: Array<FeedParams>;
}
export interface DocSynchronizerParams<T, B extends Bzz = Bzz> extends DocWriterParams<T, B> {
    pushInterval?: number;
    sources?: Array<DocSubscriber<T, B>>;
}
export interface DocSynchronizerSerialized extends DocSerialized {
    sources: Array<DocSerialized>;
}
