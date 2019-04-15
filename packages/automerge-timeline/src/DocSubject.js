// @flow

import type { Chapter, Timeline } from '@erebos/timeline'
import Automerge from 'automerge'
import { BehaviorSubject } from 'rxjs'

import type { DocContent, DocSerialized, DocSubjectParams } from './types'

export default class DocSubject<T> extends BehaviorSubject<T> {
  _chapterID: ?string
  _timeline: Timeline<DocContent>

  constructor(params: DocSubjectParams) {
    if (params.doc != null) {
      const { chapterID, docString } = params.doc
      super(Automerge.load(docString))
      if (chapterID != null) {
        this._chapterID = chapterID
      }
    } else {
      super(Automerge.init())
    }
    this._timeline = params.timeline
  }

  save(): DocSerialized {
    return {
      chapterID: this._chapterID,
      docString: Automerge.save(this.value),
    }
  }

  push(doc: T) {
    const changes = Automerge.diff(this.value, doc)
    if (changes.length === 0) {
      return false
    } else {
      this.next(doc)
      return true
    }
  }

  applyUpdate(chapters: Array<Chapter<DocContent>>): boolean {
    let doc = this.value
    chapters.forEach(chapter => {
      // TODO: validate chapter content version and other metadata
      doc = Automerge.applyChanges(doc, chapter.content.changes)
      this._chapterID = chapter.id
    })
    return this.push(doc)
  }

  // TODO? this might be useful to make it an observable rather than a promise to iterate over all chapters
  // If the automerge changes spec also makes the seq field relevant, it could be used as a progress indication
  async pullChanges(sinceID?: string): Promise<boolean> {
    const id = sinceID || this._chapterID
    const chapters = []
    for await (const chapter of this._timeline.createIterator(id)) {
      chapters.unshift(chapter)
    }
    return this.applyUpdate(chapters)
  }
}
