<script setup lang="ts">
// Live camera feed in the terminal: ffmpeg (avfoundation) streams raw RGBA
// frames that CameraRenderable draws through OptimizedBuffer's half-block
// supersampling — the same CPU path the 3D demos use for GPU readback.
import { Box, computed, onKeyDown, ref, Text, useTerminalSize } from 'vue-termui'
import { CameraView } from '../../camera/CameraView'
import { listCameraDevices } from '../../camera/CameraStream'

const device = ref(0)
const error = ref<string | null>(null)
const devices = ref<string[]>([])

listCameraDevices().then((names) => {
  devices.value = names
})

const deviceName = computed(() => devices.value[device.value] ?? `device ${device.value}`)

onKeyDown((key) => {
  const count = Math.max(devices.value.length, 1)
  if (key.name === 'n') {
    device.value = (device.value + 1) % count
    error.value = null
  } else if (key.name === 'p') {
    device.value = (device.value + count - 1) % count
    error.value = null
  }
})

const { height: rows } = useTerminalSize()
const viewHeight = computed(() => Math.max(8, rows.value - 8))
</script>

<template>
  <Box flexDirection="column">
    <Text>Camera — {{ deviceName }}</Text>
    <Text dim>N/P: next/previous camera ({{ device + 1 }}/{{ Math.max(devices.length, 1) }})</Text>
    <Text v-if="error" fg="red">{{ error }}</Text>
    <CameraView width="100%" :height="viewHeight" :device="device" @error="error = $event" />
  </Box>
</template>
