import {
  Emitter as _Emitter,
  EventHandlerList,
  EventHandlerMap,
  EventType,
  Handler,
  WildCardEventHandlerList,
  // WildcardHandler,
} from 'mitt'

type GenericEventHandler<Events extends Record<EventType, unknown>> =
  | Handler<Events[keyof Events]>
  | WildcardHandler<Events>

export type RemoveEventListener = () => void

type WildcardHandler<T extends Record<string, unknown>> = {
  [K in keyof T]: (type: K, event: T[K]) => void
}[keyof T]

type WW<T extends Record<string, unknown>> = <K extends keyof T>(
  type: K,
  event: T[K]
) => void

// <K extends keyof T>(type: K, event: T[K]) => void;

type E = { a: { isA: boolean }; b: { isB: boolean } }
type A = WildcardHandler<E>
type B = WildcardHandler<E>
type C = WW<E>

function on<E extends Record<string, unknown>>(handler: WW<E>) {}
on<E>((type, event) => {
  if (type === 'a') {
    type
    event
  }
})

export class EventEmitter<Events extends Record<EventType, unknown>> {
  /**
   * A Map of event names to registered handler functions.
   */
  all: EventHandlerMap<Events>

  constructor(all?: EventHandlerMap<Events>) {
    this.all = all || new Map()
  }

  /**
   * Register an event handler for the given type.
   * @param {string|symbol} type Type of event to listen for, or `'*'` for all events
   * @param {Function} handler Function to call in response to given event
   * @memberOf mitt
   */
  on<Key extends keyof Events>(
    type: Key,
    handler: Handler<Events[Key]>
  ): RemoveEventListener
  on(type: '*', handler: WildcardHandler<Events>): RemoveEventListener
  on(
    type: EventType,
    handler: GenericEventHandler<Events>
  ): RemoveEventListener {
    if (!this.all.has(type)) {
      this.all.set(type, [])
    }
    const handlers: Array<GenericEventHandler<Events>> = this.all.get(type)!
    handlers.push(handler)

    return () => handlers.splice(handlers.indexOf(handler) >>> 0, 1)
  }

  /**
   * Remove an event handler for the given type.
   * If `handler` is omitted, all handlers of the given type are removed.
   * @param {string|symbol} type Type of event to unregister `handler` from, or `'*'`
   * @param {Function} [handler] Handler function to remove
   * @memberOf mitt
   */
  off<Key extends keyof Events>(type: Key, handler?: Handler<Events[Key]>): void
  off(type: '*', handler: WildcardHandler<Events>): void
  off(type: EventType, handler?: GenericEventHandler<Events>): void {
    const handlers: Array<GenericEventHandler<Events>> | undefined =
      this.all.get(type)
    if (handlers) {
      if (handler) {
        handlers.splice(handlers.indexOf(handler) >>> 0, 1)
      } else {
        this.all.set(type, [])
      }
    }
  }

  /**
   * Invoke all handlers for the given type.
   * If present, `'*'` handlers are invoked after type-matched handlers.
   *
   * Note: Manually firing '*' handlers is not supported.
   *
   * @param {string|symbol} type The event type to invoke
   * @param {Any} [evt] Any value (object is recommended and powerful), passed to each handler
   * @memberOf mitt
   */
  emit<Key extends keyof Events>(type: Key, event: Events[Key]): void
  emit<Key extends keyof Events>(
    type: undefined extends Events[Key] ? Key : never
  ): void
  emit(type: EventType, evt?: any) {
    let handlers = this.all.get(type)
    if (handlers) {
      ;(handlers as EventHandlerList<Events[keyof Events]>)
        .slice()
        .map((handler) => {
          handler(evt!)
        })
    }

    handlers = this.all.get('*')
    if (handlers) {
      ;(handlers as WildCardEventHandlerList<Events>).slice().map((handler) => {
        handler(type, evt!)
      })
    }
  }
}

function test() {
  // const emitter = mitt<{ a: string, b: number }>()
  const emitter = new EventEmitter<{
    a: { isA: boolean }
    b: { isB: boolean }
  }>()

  emitter.on('a', (event) => {})

  emitter.on('*', (type, event) => {
    if (type === 'a') {
      type
      event
    }
  })
}
