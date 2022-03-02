<script setup lang="ts">
const n = ref(0)
onMounted(() => {
  setInterval(() => {
    n.value++
  }, 1000)
})
</script>

<template>
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
</template>
