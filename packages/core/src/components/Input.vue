<script setup lang="ts">
import { computed, ref, toRef, watch } from '@vue/runtime-core'
import { onInputData } from '../composables/input'
import { isKeyDataEvent } from '../input/types'
import { useInterval } from '../composables/utils'
import { useFocus } from '../focus/Focusable'

const emit = defineEmits<{
  (event: 'update:modelValue', value: string): void
}>()

const props = withDefaults(
  defineProps<{
    modelValue?: string
    disabled?: boolean
    label?: string
    minWidth?: number
    type?: 'text' | 'password'
  }>(),
  {
    minWidth: 10,
    type: 'text',
  }
)

const { active, disabled } = useFocus({
  // @ts-expect-error: vue bug?
  disabled: toRef(props, 'disabled'),
})

watch(active, () => {
  if (active.value) {
    restartBlinking()
  }
})

// used for fallback value when no v-model
const localText = ref('')
const text = computed({
  get() {
    return props.modelValue ?? localText.value
  },
  set(value) {
    if (props.modelValue == null) {
      localText.value = value
    } else {
      emit('update:modelValue', value)
    }
  },
})
const cursorPosition = ref(text.value.length)
const displayedValue = computed(() => {
  const textValue =
    props.type === 'text' ? text.value : '*'.repeat(text.value.length)
  if (showCursorBlock.value && active.value) {
    return (
      textValue.slice(0, cursorPosition.value) +
      FULL_BLOCK +
      textValue.slice(cursorPosition.value + 1) +
      (cursorPosition.value >= textValue.length ? '' : ' ')
    )
  }
  return textValue + ' '
})

const FULL_BLOCK = '\u{2588}' // '█'
const showCursorBlock = ref(true)

const { restart } = useInterval(() => {
  showCursorBlock.value = !showCursorBlock.value
}, 700)
// allows to always show the cursor while moving it
function restartBlinking() {
  restart()
  showCursorBlock.value = true
}

onInputData(({ event }) => {
  if (active.value && !disabled.value) {
    if (isKeyDataEvent(event)) {
      switch (event.key) {
        // cursor moving
        case 'ArrowLeft':
          cursorPosition.value = Math.max(0, cursorPosition.value - 1)
          // TODO: handle alt, ctrl
          restartBlinking()
          break
        case 'ArrowRight':
          cursorPosition.value = Math.min(
            text.value.length,
            cursorPosition.value + 1
          )
          restartBlinking()
          break

        case 'Backspace':
          if (cursorPosition.value > 0) {
            text.value =
              text.value.slice(0, cursorPosition.value - 1) +
              text.value.slice(cursorPosition.value)
            cursorPosition.value--
          }
          break
        case 'e':
        case 'E':
          if (event.ctrlKey) {
            cursorPosition.value = text.value.length
            restartBlinking()
            break
          }

        case 'a':
        case 'A':
          if (event.ctrlKey) {
            cursorPosition.value = 0
            restartBlinking()
            break
          }

        case 'u':
        case 'U':
          if (event.ctrlKey) {
            text.value = text.value.slice(cursorPosition.value)
            cursorPosition.value = 0
            restartBlinking()
            break
          }

        case 'k':
        case 'K':
          if (event.ctrlKey) {
            text.value = text.value.slice(0, cursorPosition.value)
            restartBlinking()
            break
          }

        default:
          if (
            event.key.length === 1 &&
            !event.altKey &&
            !event.ctrlKey &&
            !event.metaKey
          ) {
            text.value =
              text.value.slice(0, cursorPosition.value) +
              event.key +
              text.value.slice(cursorPosition.value)
            cursorPosition.value++
          }
          break
      }
    }
  }
})
</script>

<template borderStyle="round">
  <Box>
    <Box alignItems="center">
      <!-- Could also be a title prop in Box -->
      <Text dimmed>{{ label }} </Text>
    </Box>
    <Box
      borderStyle="round"
      :borderColor="disabled ? 'gray' : active ? 'blue' : undefined"
      :backgroundColor="active ? 'blue' : undefined"
      :height="3"
      :minWidth="minWidth"
    >
      <Text :dimmed="disabled">{{ displayedValue }}</Text>
    </Box>
  </Box>
</template>
