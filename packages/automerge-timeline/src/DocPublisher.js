// @flow

import type { Chapter, PartialChapter } from '@erebos/timeline'
import Automerge from 'automerge'

import DocSubject from './DocSubject'
import type {
  DocChanges,
  DocContent,
  DocPublisherParams,
  DocUpdater,
} from './types'

export default class DocPublisher<T> extends DocSubject<T> {
  _publishedDoc: ?T
  _publishQueue: ?Promise<?string>
  _updateTimeline: (
    chapter: $Shape<PartialChapter<DocContent>>,
  ) => Promise<Chapter<DocContent>>

  constructor(params: DocPublisherParams) {
    super(params)
    this._updateTimeline = params.timeline.createUpdater(params.chapterDefaults)
  }

  async init() {
    await this.pullChanges()
    this._publishedDoc = this.value
  }

  change(updater: DocUpdater<T>) {
    const doc = Automerge.change(this.value, updater)
    this.push(doc)
  }

  merge(other: T) {
    const doc = Automerge.merge(this.value, other)
    this.push(doc)
  }

  async publish(): Promise<?string> {
    if (this._publishedDoc == null) {
      throw new Error('doc is not setup')
    }
    if (this._publishQueue != null) {
      await this._publishQueue
    }
    const changes = Automerge.getChanges(this._publishedDoc, this.value)
    if (changes.length === 0) {
      return
    }
    this._publishQueue = this.publishChanges(changes)
    const id = await this._publishQueue
    this._publishQueue = undefined
    return id
  }

  async publishChanges(changes: DocChanges): Promise<string> {
    const doc = this.value
    // TODO: add other content data, such as version and snapshot pointers
    const chapter = await this._updateTimeline({ content: { changes } })
    this._publishedDoc = doc
    return chapter.id
  }
}
