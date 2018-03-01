// @flow

import { WebSocketSubject } from 'rxjs/observable/dom/WebSocketSubject'

export default (url: string) => new WebSocketSubject({ url })
