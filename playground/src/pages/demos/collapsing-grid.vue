<script setup lang="ts">
// "Collapsing Grid 1" from shaders.com, installed via the Shaders MCP
// (get-preset id: cbb03336-6b08-441a-9ec0-33e69c37e345). The preset runs on
// the real shaders.com runtime (shaders/js), rendered into terminal cells by
// ShadersView.
import type { PresetConfig } from 'shaders/js'
import { Box, computed, onKeyDown, ref, Text, useTemplateRef, useTerminalSize } from 'vue-termui'
import { ShadersView, type ShadersRenderable } from '../../components/ShadersView'

const preset: PresetConfig = {
  components: [
    {
      type: 'Group',
      id: 'idmpijta5dnhqxghigt',
      props: { visible: false },
      children: [
        {
          type: 'SineWave',
          props: {
            amplitude: 0.4,
            angle: 133,
            frequency: 0.6,
            position: { x: 0.07, y: 0.08 },
            softness: 0.8,
            thickness: 0.5,
            visible: true,
          },
        },
        {
          type: 'ChromaFlow',
          props: {
            baseColor: '#ffffff',
            downColor: '#ffffff',
            intensity: 1.5,
            leftColor: '#ffffff',
            momentum: 15,
            opacity: 0.4,
            radius: 4.3,
            rightColor: '#ffffff',
            upColor: '#ffffff',
            visible: true,
          },
        },
      ],
    },
    { type: 'SolidColor', props: { color: '#ffe424' } },
    {
      type: 'Pixelate',
      props: {
        gap: 0.03,
        roundness: {
          type: 'map',
          source: 'idmpijta5dnhqxghigt',
          channel: 'alpha',
          inputMax: 1,
          inputMin: 0,
          outputMax: 1,
          outputMin: 0.13,
        },
        scale: 18,
      },
      children: [
        {
          type: 'Swirl',
          props: {
            colorA: '#ff47ff',
            colorB: '#f3fc4d',
            colorSpace: 'oklab',
            detail: 1.3,
            speed: 2,
            visible: true,
          },
        },
      ],
    },
  ],
}

const view = useTemplateRef<{ renderable: ShadersRenderable | null }>('view')
const paused = ref(false)

onKeyDown((key) => {
  const shader = view.value?.renderable?.instance
  if (!shader) return
  if (key.name === 'space') {
    paused.value = !paused.value
    if (paused.value) shader.pause()
    else shader.resume()
  } else if (key.name === 'p') {
    view.value?.renderable?.saveToFile(`collapsing-grid-${Date.now()}.png`)
  }
})

const { height: rows } = useTerminalSize()
const sceneHeight = computed(() => Math.max(8, rows.value - 10))
</script>

<template>
  <Box flexDirection="column">
    <Text
      >Collapsing Grid — shaders.com runtime in the terminal — Space: pause | P: screenshot{{
        paused ? ' (paused)' : ''
      }}</Text
    >
    <ShadersView ref="view" :preset="preset" width="100%" :height="sceneHeight" />
  </Box>
</template>
