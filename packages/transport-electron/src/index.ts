import { ipcRenderer, Event } from 'electron'
import { Subject, Subscriber, Subscription } from 'rxjs'
import { AnonymousSubject } from 'rxjs/internal/Subject'

export class ElectronTransport<T = any> extends AnonymousSubject<T> {
  private _output: Subject<T>

  public constructor(channel = 'rpc-message') {
    super()

    this._output = new Subject()

    this.destination = Subscriber.create(
      msg => {
        ipcRenderer.send(channel, msg)
      },
      err => {
        this._output.error(err)
        // @ts-ignore: not present in RxJS declaration file
        this._reset()
      },
    )

    ipcRenderer.on(channel, (_: Event, msg: T) => {
      try {
        this._output.next(msg)
      } catch (err) {
        this._output.error(err)
      }
    })
  }

  public _subscribe(subscriber: Subscriber<T>): Subscription {
    const subscription = new Subscription()
    subscription.add(this._output.subscribe(subscriber))
    return subscription
  }
}

export function createTransport<T = any>(
  channel?: string,
): ElectronTransport<T> {
  return new ElectronTransport<T>(channel)
}
