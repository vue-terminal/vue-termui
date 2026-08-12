<script setup lang="ts">
// A focusable navigation entry. It owns no routing logic — the parent Sidebar
// drives focus (↑/↓) and pushes the route on Enter. We expose `focus()`, the
// reactive `focused` state and the backing `element` so the Sidebar can
// coordinate the list and keep the focused link scrolled into view.
//
// `selected` is the Sidebar's own cursor, which survives a page stealing focus:
// a focused link is always selected too, but the selection stays visible (dimmer)
// while the filter Input holds focus.
import {
  Box,
  type BoxElement,
  computed,
  shallowRef,
  Text,
  useCurrentFocusedElement,
} from 'vue-termui'

defineProps<{ label: string; selected?: boolean }>()

// The backing OpenTUI renderable. Bound to `<Box>`, the ref receives the
// component's public instance, so unwrap its `$el` to reach the renderable.
const el = shallowRef<BoxElement>()
const currentFocused = useCurrentFocusedElement()
const focused = computed(() => !!el.value && currentFocused.value === el.value)

function setRef(instance: any): void {
  el.value = instance?.$el ?? instance ?? null
}
function focus(): void {
  el.value?.focus()
}

defineExpose({ focus, focused, element: el })

const emit = defineEmits<{
  selected: []
}>()
</script>

<template>
  <Box
    :ref="setRef"
    focusable
    :paddingLeft="1"
    :paddingRight="1"
    :backgroundColor="focused ? '#42b883' : selected ? '#1f4536' : 'transparent'"
    @keyDown.enter="emit('selected')"
    @mouseDown.left="emit('selected')"
  >
    <Text :fg="focused ? '#0b0b0b' : selected ? '#ffffff' : '#cccccc'" :bold="focused || selected">
      {{ focused || selected ? '›' : ' ' }} {{ label }}
    </Text>
  </Box>
</template>
