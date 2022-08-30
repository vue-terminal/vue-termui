<script setup lang="ts">
import { ref, reactive, MouseDataEvent, MouseEventType } from 'vue-termui'
import Logo from './VueTermUILogo.vue'
import Input from './Input.vue'

const n = ref(0)

onKeyData(['ArrowUp', 'ArrowRight', '+'], (event) => {
  n.value++
})
onKeyData(['ArrowDown', 'ArrowLeft', '-'], (event) => {
  n.value--
})

onKeyData((event) => {
  lastPress.value = event.key || event.input
})

const pressData = ref<MouseDataEvent>()
onMouseData(MouseEventType.any, (event) => {
  // pressData.value = `MB${event.button}: ${event.clientX}x${event.clientY}`
  position.x = event.clientX - 1
  position.y = event.clientY - 1
  pressData.value = event
})

const lastPress = ref('')

const presses = ref(0)
const position = reactive({ x: 1, y: 1 })
onInputData(({ data, event }) => {
  presses.value++
  const escapedSeq = inputDataToString(data)
  lastPress.value = ''
  if (isKeyDataEvent(event)) {
    lastPress.value += event.key
  }
  lastPress.value += lastPress.value ? ` (${escapedSeq})` : escapedSeq
})
</script>

<template>
  <Div
    width="100%"
    :height="20"
    justifyContent="center"
    flexDirection="column"
    alignItems="center"
    borderStyle="round"
    @keypress.h="n++"
  >
    <div>
      <span>
        <Text color="red" bold dimmed
          >Last Keypress ({{ presses }}) "{{ lastPress }}"</Text
        >
        <br />
        <Link href="https://esm.dev">Site</Link>
      </span>
    </div>
    <Logo />
    <div
      :width="40"
      :height="10"
      position="absolute"
      :top="position.y"
      :left="position.x"
    >
      <span bold
        >Mouse button: {{ pressData?.button }} ({{
          MouseEventType[pressData?._type ?? MouseEventType.unknown]
        }}): {{ position.x }}x{{ position.y }}</span
      >
    </div>
  </Div>
</template>
