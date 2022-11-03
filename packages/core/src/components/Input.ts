import { defineComponent, h, ref, computed, watch } from '@vue/runtime-core'
import type { PropType } from '@vue/runtime-core'
import chalk from 'chalk'
import { TuiText } from './Text'
import { onInputData } from '../composables/input'
import type { KeyDataEvent } from '../input/types'

const SKIP_EVENT_KEY = ['ArrowUp', 'ArrowDown', 'Ctrl', 'Tab', 'Shift']
const PWD_FIGURE = '*'

export const TuiInput = defineComponent({
  props: {
    placeholder: {
      type: String,
      default: '',
    },
    modelValue: {
      type: String,
      required: true,
    },
    type: {
      type: String as PropType<'text' | 'password'>,
      default: 'text',
    },
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    // TODO: focus,blur support
    const active = ref(true)
    const cursorOffset = ref(props.modelValue.length)
    const content = computed(() => {
      if (active.value) {
        if (props.modelValue) {
          if (
            props.modelValue &&
            props.modelValue.length <= cursorOffset.value
          ) {
            return (
              (props.type === 'text'
                ? props.modelValue
                : PWD_FIGURE.repeat(props.modelValue.length)) +
              chalk.inverse(' ')
            )
          }

          const l = props.modelValue.slice(0, cursorOffset.value)
          const m = chalk.inverse(props.modelValue[cursorOffset.value])
          const r = props.modelValue.slice(cursorOffset.value + 1)

          return props.type === 'text'
            ? l + m + r
            : PWD_FIGURE.repeat(l.length) +
                chalk.inverse(PWD_FIGURE) +
                PWD_FIGURE.repeat(r.length)
        } else {
          return props.placeholder ? '' : chalk.inverse(' ')
        }
      } else {
        const value = props.modelValue
        return props.type === 'text' ? value : PWD_FIGURE.repeat(value.length)
      }
    })

    function updateCursorOffset(offset: number) {
      cursorOffset.value = Math.max(
        0,
        Math.min(cursorOffset.value + offset, props.modelValue.length + 1)
      )
    }

    function updateValue(value: string) {
      emit('update:modelValue', value)
    }

    onInputData(({ data, event }) => {
      if (!active.value) return
      const eventKey = (<KeyDataEvent>event!).key
      if (SKIP_EVENT_KEY.includes(eventKey) || !eventKey) return

      // Move cursor
      if (eventKey === 'ArrowLeft') {
        updateCursorOffset(-1)
      } else if (eventKey === 'ArrowRight') {
        updateCursorOffset(1)
      }
      // Delete Content
      else if (eventKey === 'Backspace' || eventKey === 'Delete') {
        if (cursorOffset.value > 0) {
          updateValue(
            props.modelValue.slice(0, cursorOffset.value - 1) +
              props.modelValue.slice(cursorOffset.value)
          )
          updateCursorOffset(-1)
        }
      }
      // Typing Content
      else {
        updateValue(
          props.modelValue.slice(0, cursorOffset.value) +
            data +
            props.modelValue.slice(cursorOffset.value)
        )
        updateCursorOffset(1)
        if (cursorOffset.value === props.modelValue.length) {
          updateCursorOffset(1)
        }
      }
    })

    return () =>
      props.placeholder && !props.modelValue
        ? h(
            TuiText,
            {
              dimmed: true,
            },
            () => props.placeholder
          )
        : h(TuiText, () => content.value)
  },
})
