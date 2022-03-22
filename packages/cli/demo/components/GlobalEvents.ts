import {
  defineComponent,
  onMounted,
  onBeforeUnmount,
  ref,
  onActivated,
  onDeactivated,
} from 'vue'
import type { PropType, VNodeProps } from 'vue'
import type { KeyDataEventRawHandlerFn } from 'vue-termui'
import { onKeyData } from 'vue-termui'

const EVENT_NAME_RE = /^on(\w+?)((?:Once|Capture|Passive)*)$/
const MODIFIERS_SEPARATOR_RE = /[OCP]/g

export interface GlobalEventsProps {
  filter?: EventFilter
}

export type EventFilter = (
  event: Event,
  listener: EventListener,
  name: string
) => any

type Options = AddEventListenerOptions & EventListenerOptions

function extractEventOptions(
  modifiersRaw: string | undefined
): Options | undefined | boolean {
  if (!modifiersRaw) return

  const modifiers = modifiersRaw
    .replace(MODIFIERS_SEPARATOR_RE, ',$&')
    .toLowerCase()
    // remove the initial comma
    .slice(1)
    .split(',') as Array<'capture' | 'passive' | 'once'>

  return modifiers.reduce((options, modifier) => {
    options[modifier] = true
    return options
  }, {} as Options)
}

export const GlobalEventsImpl = defineComponent({
  name: 'GlobalEvents',

  props: {
    filter: {
      type: Function as PropType<EventFilter>,
      default: () => () => true,
    },
  },

  setup(props, { attrs }) {
    const isActive = ref(true)
    onActivated(() => {
      isActive.value = true
    })
    onDeactivated(() => {
      isActive.value = false
    })

    const keyDataHandlers: KeyDataEventRawHandlerFn[] = []
    onKeyData((event) => {
      keyDataHandlers.forEach((handler) => handler(event))
    })

    Object.keys(attrs)
      .filter((name) => name.startsWith('on'))
      .forEach((eventNameWithModifiers) => {
        const listener = attrs[eventNameWithModifiers] as
          | EventListener
          | EventListener[]
        const listeners = Array.isArray(listener) ? listener : [listener]
        const match = eventNameWithModifiers.match(EVENT_NAME_RE)

        if (!match) {
          if (__DEV__) {
            console.warn(
              `[vue-global-events] Unable to parse "${eventNameWithModifiers}". If this should work, you should probably open a new issue on https://github.com/shentao/vue-global-events.`
            )
          }
          return
        }

        let [, eventName, modifiersRaw] = match
        eventName = eventName.toLowerCase()

        const handlers: EventListener[] = listeners.map(
          (listener) => (event) => {
            isActive.value &&
              props.filter(event, listener, eventName) &&
              listener(event)
          }
        )

        const options = extractEventOptions(modifiersRaw)

        handlers.forEach((handler) => {
          // TODO: filter based on eventName
          onKeyData(handler)
        })
      })

    return () => null
  },
})

// export the public type for h/tsx inference
// also to avoid inline import() in generated d.ts files
/**
 * Component of vue-lib.
 */
export const GlobalEvents = GlobalEventsImpl as any as {
  new (): {
    $props: VNodeProps & GlobalEventsProps
  }
}
