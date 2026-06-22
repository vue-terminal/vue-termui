<script setup lang="ts">
// A focusable navigation entry. It owns no routing logic — the parent Sidebar
// drives focus (↑/↓) and pushes the route on Enter. We expose `focus()` and the
// reactive `focused` state so the Sidebar can coordinate the list.
import { Box, Text, useFocus } from 'vue-termui'

defineProps<{ label: string }>()

const { ref: boxRef, focused, focus } = useFocus()

defineExpose({ focus, focused })
</script>

<template>
  <!-- `:focusable` is set eagerly here so the parent can focus this link on the
       very first tick; `useFocus` also sets it, this just avoids a timing race. -->
  <Box
    :ref="boxRef"
    :focusable="true"
    :paddingLeft="1"
    :paddingRight="1"
    :backgroundColor="focused ? '#42b883' : undefined"
  >
    <Text :fg="focused ? '#0b0b0b' : '#cccccc'" :bold="focused">
      {{ focused ? '›' : ' ' }} {{ label }}
    </Text>
  </Box>
</template>
