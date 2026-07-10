<script setup lang="ts">
// Basic TresJS scene: the scene graph is declared with Tres components in the
// template (built by Tres's custom renderer) while @vue-termui/three draws it
// into the terminal — see <TresTerminal>. Reactivity flows straight from
// script refs into three.js objects (color cycling), and template refs give
// the backing objects for imperative work (spinning the cube via onFrame).
import { onFrame, type ThreeRenderable } from '@vue-termui/three'
import type { Mesh } from 'three'
import { Box, computed, onKeyDown, ref, shallowRef, Text, useTerminalSize } from 'vue-termui'
import TresTerminal from '../../components/TresTerminal.vue'

const { height: rows } = useTerminalSize()
const sceneHeight = computed(() => Math.max(8, rows.value - 10))

const tres = shallowRef<{ renderable: ThreeRenderable | null } | null>(null)

// plain shallowRef bound via the string ref: useTemplateRef wraps the value in
// a dev-only readonly proxy, which blocks mutating the mesh per frame
const cube = shallowRef<Mesh | null>(null)

const COLORS = ['#41b883', '#e4a03d', '#64b5f6', '#e57373'] as const
const colorIndex = ref(0)
const color = computed(() => COLORS[colorIndex.value % COLORS.length]!)

const spinning = ref(true)

onFrame((deltaMs) => {
  if (!spinning.value || !cube.value) return
  const deltaTime = deltaMs / 1000
  cube.value.rotation.x += 0.5 * deltaTime
  cube.value.rotation.y += 0.9 * deltaTime
})

onKeyDown((key) => {
  if (key.name === 'space') spinning.value = !spinning.value
  if (key.name === 'c') colorIndex.value++
  if (key.name === 'u') tres.value?.renderable?.renderer.toggleSuperSampling()
})
</script>

<template>
  <Box flexDirection="column">
    <Text>TresJS — declarative three.js components rendered by @vue-termui/three</Text>
    <Text dim
      >Space: toggle spin ({{ spinning ? 'on' : 'off' }}) · C: cycle color ({{ color }}) · U:
      supersampling</Text
    >
    <Box :border="true" title="tres" width="100%" :height="sceneHeight">
      <TresTerminal ref="tres">
        <TresPerspectiveCamera :position="[0, 0, 3.2]" />
        <TresAmbientLight :intensity="0.35" />
        <TresDirectionalLight :position="[2.5, 2, 3]" :intensity="1.3" />
        <TresMesh ref="cube">
          <TresBoxGeometry :args="[1.4, 1.4, 1.4]" />
          <TresMeshPhongMaterial :color="color" :shininess="80" specular="#e6e6ff" />
        </TresMesh>
      </TresTerminal>
    </Box>
  </Box>
</template>
