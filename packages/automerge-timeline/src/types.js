// @flow

import type { default as Bzz, FeedParams } from '@erebos/api-bzz-base'
import type { PartialChapter, Timeline } from '@erebos/timeline'

// TODO
export type DocChanges = Array<any>

// TODO: other than only changes, also add version and maybe snapshot pointers?
export type DocContent = { changes: DocChanges }

export type DocSerialized = {
  chapterID?: ?string,
  docString: string,
}

export type DocSubjectParams = {
  doc?: ?DocSerialized,
  timeline: Timeline<DocContent>,
}

export type DocSubscriberParams = DocSubjectParams & {
  pollInterval: number,
}

export type DocUpdater<T> = (doc: T) => void

export type DocPublisherParams = DocSubjectParams & {
  chapterDefaults?: $Shape<PartialChapter<DocContent>>,
}

export type DocSource = {
  doc?: ?DocSerialized,
  timeline: Timeline<DocContent> | string | FeedParams,
}

export type DocSynchronizerSerialized = {
  doc: DocSerialized,
  sources: Array<DocSerialized>,
}

export type DocSynchronizerParams = DocPublisherParams & {
  // TODO: add auto-publish inverval?
  bzz?: Bzz,
  pollInterval?: number,
  sources?: Array<DocSource>,
}
