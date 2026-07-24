<script setup lang="ts">
// "Undertones 3" from shaders.com, installed via the Shaders MCP
// (get-preset id: dd87173f-d236-4b7e-8cf6-605126302ccb). The preset runs on
// the real shaders.com runtime (shaders/js), rendered into terminal cells by
// ShadersView.
import type { PresetConfig } from 'shaders/js'
import { Box, computed, onKeyDown, ref, Text, useTemplateRef, useTerminalSize } from 'vue-termui'
import { ShadersView, type ShadersRenderable } from '../../components/ShadersView'

const preset: PresetConfig = {
  components: [
    { type: 'Swirl', props: { colorA: '#000000', colorB: '#0a0a0a', detail: 1.7 } },
    {
      type: 'ChromaFlow',
      props: {
        baseColor: '#18181a',
        downColor: '#b5b5b5',
        leftColor: '#4f4f4f',
        momentum: 13,
        rightColor: '#ebebeb',
        upColor: '#f5fff0',
      },
    },
    {
      type: 'FlutedGlass',
      props: {
        aberration: 0.61,
        angle: 120,
        frequency: 8,
        highlight: 0.12,
        highlightSoftness: 0,
        lightAngle: -90,
        refraction: 4,
        shape: 'rounded',
        softness: 1,
        speed: 0.15,
      },
    },
    { type: 'FilmGrain', props: { strength: 0.05 } },
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
    view.value?.renderable?.saveToFile(`undertones-${Date.now()}.png`)
  }
})

const { height: rows } = useTerminalSize()
const sceneHeight = computed(() => Math.max(8, rows.value - 10))
</script>

<template>
  <Box flexDirection="column">
    <Text
      >Undertones — shaders.com runtime in the terminal — move the mouse to stir it — Space: pause |
      P: screenshot{{ paused ? ' (paused)' : '' }}</Text
    >
    <ShadersView ref="view" :preset="preset" width="100%" :height="sceneHeight" />
  </Box>
</template>
