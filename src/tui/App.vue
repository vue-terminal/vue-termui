<script setup lang="ts">
const n = ref(0)

const log = useLog()

onMounted(() => {
  log('mounted!')
  setInterval(() => {
    n.value++
  }, 1000)
})

onBeforeUnmount(() => {
  const instance = getCurrentInstance()
  log('removed')
  // console.log(instance?.vnode.el)
})
</script>

<template>
  <div>
    Counter: {{ n }}
    <!-- <tui-test hey="true" disabled> child </tui-test> -->
    <!-- <div class="hello">child</div>
    <p ref="root">
      child
      <span>hey</span>
    </p> -->
  </div>
</template>
