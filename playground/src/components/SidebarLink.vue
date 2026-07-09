<script setup lang="ts">
// A focusable navigation entry. It owns no routing logic — the parent Sidebar
// drives focus (↑/↓) and pushes the route on Enter. We expose `focus()`, the
// reactive `focused` state and the backing `element` so the Sidebar can
// coordinate the list and keep the focused link scrolled into view.
import type { BoxRenderable } from '@opentui/core'
import { Box, Text, computed, shallowRef, useCurrentFocusedElement } from 'vue-termui'

defineProps<{ label: string }>()

// The backing OpenTUI renderable. Bound to `<Box>`, the ref receives the
// component's public instance, so unwrap its `$el` to reach the renderable.
const el = shallowRef<BoxRenderable>()
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
    :backgroundColor="focused ? '#42b883' : 'transparent'"
    @keyDown.enter="emit('selected')"
    @mouseDown.left="emit('selected')"
  >
    <Text :fg="focused ? '#0b0b0b' : '#cccccc'" :bold="focused">
      {{ focused ? '›' : ' ' }} {{ label }}
    </Text>
  </Box>
</template>
