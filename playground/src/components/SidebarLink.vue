<script setup lang="ts">
// A focusable navigation entry. It owns no routing logic — the parent Sidebar
// drives focus (↑/↓) and pushes the route on Enter. We expose `focus()` and the
// reactive `focused` state so the Sidebar can coordinate the list.
import { Box, Text, computed, shallowRef, useCurrentFocusedElement } from 'vue-termui'

defineProps<{ label: string }>()

// The backing OpenTUI renderable. Bound to `<Box>`, the ref receives the
// component's public instance, so unwrap its `$el` to reach the renderable.
const el = shallowRef<any>(null)
const currentFocused = useCurrentFocusedElement()
const focused = computed(() => !!el.value && currentFocused.value === el.value)

function setRef(instance: any): void {
  el.value = instance?.$el ?? instance ?? null
}
function focus(): void {
  el.value?.focus()
}

defineExpose({ focus, focused })
</script>

<template>
  <!-- `:focusable` marks the link focusable so the parent can focus it on the
       very first tick. -->
  <Box
    :ref="setRef"
    focusable
    :paddingLeft="1"
    :paddingRight="1"
    :backgroundColor="focused ? '#42b883' : undefined"
  >
    <Text :fg="focused ? '#0b0b0b' : '#cccccc'" :bold="focused">
      {{ focused ? '›' : ' ' }} {{ label }}
    </Text>
  </Box>
</template>
