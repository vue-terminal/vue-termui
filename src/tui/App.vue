<script setup lang="ts">
import { TuiBox as Box } from 'vue-termui'

const n = ref(0)
onMounted(() => {
  setInterval(() => {
    n.value++
  }, 1000)
})
</script>

<template>
  <Box align-items="flex-end" justify="center" width="80" height="50">
    <span color="red"
      >Counter: <span bold>{{ n }}</span
      >.
      <br />
      <span color="blue"
        >is it Odd?
        <span :inverse="n % 2 == 0">
          {{ n % 2 == 0 ? 'No' : 'Yes' }}
        </span>
      </span>
      <!-- <br /> -->
      <!-- <Span inverse color="yellow">Hello</Span> -->
    </span>
  </Box>
</template>
