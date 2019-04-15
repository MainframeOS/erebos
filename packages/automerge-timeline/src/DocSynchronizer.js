// @flow

import { Timeline } from '@erebos/timeline'
import { Subject } from 'rxjs'

import DocPublisher from './DocPublisher'
import DocSubscriber from './DocSubscriber'
import type {
  DocSynchronizerParams,
  DocSynchronizerSerialized,
  DocUpdater,
} from './types'

export default class DocSynchronizer<T> extends Subject<T> {
  _publisher: DocPublisher<T>
  _sources: Array<DocSubscriber<T>>

  constructor(params: DocSynchronizerParams) {
    super()
    this._publisher = new DocPublisher(params)

    if (params.sources == null) {
      this._sources = []
    } else {
      const pollInterval = params.pollInterval || 5000
      this._sources = params.sources.map(source => {
        let timeline
        if (source.timeline instanceof Timeline) {
          timeline = source.timeline
        } else if (params.bzz == null) {
          throw new Error('Missing `bzz` parameter')
        } else {
          timeline = new Timeline({ bzz: params.bzz, feed: source.timeline })
        }
        return new DocSubscriber({ doc: source.doc, pollInterval, timeline })
      })
    }
  }

  get value(): T {
    return this._publisher.value
  }

  async init() {
    await this._publisher.init()
    await Promise.all(
      this._sources.map(async s => {
        await s.init()
        s.subscribe(doc => {
          this._publisher.merge(doc)
        })
      }),
    )
    this._publisher.subscribe(this)
  }

  change(updater: DocUpdater<T>) {
    this._publisher.change(updater)
  }

  async publish(): Promise<?string> {
    return this._publisher.publish()
  }

  save(): DocSynchronizerSerialized {
    return {
      doc: this._publisher.save(),
      sources: this._sources.map(s => s.save()),
    }
  }
}
