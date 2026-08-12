<script setup lang="ts">
// donut.c homage: a spinning torus rendered as colored ASCII through the
// SuperSampleType.ASCII compute shader (luminance → glyph ramp).
import { onFrame, RGBA, SuperSampleType, Three, type ThreeRenderable } from '@vue-termui/three'
import {
  AmbientLight,
  Color,
  DirectionalLight,
  Mesh,
  MeshPhongMaterial,
  PerspectiveCamera,
  PointLight,
  Scene,
  TorusGeometry,
} from 'three'
import { Box, computed, onKeyDown, ref, Text, useTemplateRef, useTerminalSize } from 'vue-termui'
import { asciiRamps } from '../../ascii-ramps'

const scene = new Scene()

const mainLight = new DirectionalLight(new Color(1, 1, 1), 1.2)
mainLight.position.set(-4, 3, 5)
scene.add(mainLight)

const fillLight = new PointLight(new Color(1, 0.85, 0.7), 1.5, 10)
fillLight.position.set(2, -1, 2)
scene.add(fillLight)

scene.add(new AmbientLight(new Color(0.15, 0.15, 0.15), 1))

const donut = new Mesh(
  new TorusGeometry(1, 0.45, 32, 64),
  new MeshPhongMaterial({
    color: new Color(1, 0.55, 0.15),
    specular: new Color(0.9, 0.9, 0.9),
    shininess: 40,
  }),
)
scene.add(donut)

const camera = new PerspectiveCamera(45, 1, 0.1, 100)
camera.position.set(0, 0, 4.2)

const three = useTemplateRef<{ renderable: ThreeRenderable | null }>('three')
const mode = ref<SuperSampleType>(SuperSampleType.ASCII)
const rampIndex = ref(0)
const rotating = ref(true)

onKeyDown((key) => {
  const renderer = three.value?.renderable?.renderer
  if (key.name === 'space') {
    rotating.value = !rotating.value
  } else if (key.name === 'm' && renderer) {
    renderer.toggleSuperSampling()
    mode.value = renderer.getSuperSample()
  } else if (key.name === 'a' && renderer) {
    rampIndex.value = (rampIndex.value + 1) % asciiRamps.length
    renderer.setAsciiChars(asciiRamps[rampIndex.value]!.chars)
  }
})

onFrame((deltaMs) => {
  if (!rotating.value) return
  const deltaTime = deltaMs / 1000
  donut.rotation.x += 0.7 * deltaTime
  donut.rotation.z += 0.4 * deltaTime
})

const { height: rows } = useTerminalSize()
const sceneHeight = computed(() => Math.max(8, rows.value - 9))
</script>

<template>
  <Box flexDirection="column">
    <Text>ASCII donut — luminance-ramp glyphs from the ASCII compute shader</Text>
    <Text dim
      >Space: rotation ({{ rotating ? 'on' : 'off' }}) | M: mode ({{ mode }}) | A: ramp ({{
        asciiRamps[rampIndex]!.name
      }})</Text
    >
    <Three
      ref="three"
      :scene="scene"
      :camera="camera"
      width="100%"
      :height="sceneHeight"
      :renderer-options="{
        focalLength: 8,
        superSample: SuperSampleType.ASCII,
        asciiStyle: 'shape',
        backgroundColor: RGBA.fromValues(0, 0, 0, 1),
      }"
    />
  </Box>
</template>
