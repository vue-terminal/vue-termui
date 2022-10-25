import { defineComponent, h, ref, computed, PropType } from '@vue/runtime-core'
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
      required: false,
      default: '',
    },
    cursor: {
      type: Boolean,
      required: false,
      default: true,
    },
    modelValue: {
      type: String,
      required: true,
    },
    type: {
      type: String as PropType<'text' | 'password'>,
      required: false,
      default: 'text',
    },
  },
  emits: ['update:modelValue', 'change', 'submit'],
  setup(props, { emit }) {
    const cursorOffset = ref(props.modelValue.length)
    const exited = ref(false)
    const content = computed(() => {
      if (props.cursor && !exited.value) {
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

    function updateCursorOffset(type: '-' | '+') {
      if (type === '-') {
        cursorOffset.value = Math.max(0, cursorOffset.value - 1)
      } else {
        cursorOffset.value = Math.min(
          cursorOffset.value + 1,
          +props.modelValue.length + 1
        )
      }
    }

    function updateValue(value: string) {
      emit('change', value)
      emit('update:modelValue', value)
    }

    const stop = onInputData(({ data, event }) => {
      const eventKey = (<KeyDataEvent>event!).key
      if (SKIP_EVENT_KEY.includes(eventKey) || !eventKey) return

      // Submit
      if (eventKey === 'Enter') {
        stop()
        exited.value = true
        emit('submit', props.modelValue)
        return
      }

      // Move cursor
      if (props.cursor && eventKey === 'ArrowLeft') {
        updateCursorOffset('-')
      } else if (props.cursor && eventKey === 'ArrowRight') {
        updateCursorOffset('+')
      }
      // Delete Content
      else if (eventKey === 'Backspace' || eventKey === 'Delete') {
        if (!props.cursor) {
          updateValue(props.modelValue.slice(0, -1))
        } else if (props.cursor && cursorOffset.value > 0) {
          updateValue(
            props.modelValue.slice(0, cursorOffset.value - 1) +
              props.modelValue.slice(cursorOffset.value)
          )
          updateCursorOffset('-')
        }
      }
      // Typing Content
      else {
        updateValue(
          props.cursor
            ? props.modelValue.slice(0, cursorOffset.value) +
                data +
                props.modelValue.slice(cursorOffset.value)
            : props.modelValue + data
        )
        updateCursorOffset('+')
        if (props.cursor && cursorOffset.value === props.modelValue.length) {
          updateCursorOffset('+')
        }
      }
    })

    return () =>
      h(TuiText, () =>
        props.placeholder && !props.modelValue
          ? h(
              TuiText,
              {
                dimmed: true,
              },
              () => props.placeholder
            )
          : h(TuiText, () => content.value)
      )
  },
})
