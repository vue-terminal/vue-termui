<script setup lang="ts">
import { getCurrentInstance, onMounted, TuiTextTransform } from "vue-termui";

const instance = getCurrentInstance();

// console.log(!!instance)
// debugger

onMounted(() => {
  console.log(!!instance);
  // debugger
});
</script>

<template borderStyle="round">
  <TuiTextTransform dimmed bg-color="red" color="white">Label </TuiTextTransform>
</template>
