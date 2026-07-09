<script setup lang="ts">
// Port of opentui's draggable-three-demo: a transparent, absolutely-positioned
// 3D cube you can drag around with the mouse while it keeps rendering.
import { onFrame, RGBA, Three } from '@vue-termui/three'
import {
  AmbientLight,
  BoxGeometry,
  Color,
  DirectionalLight,
  Mesh,
  MeshPhongMaterial,
  PerspectiveCamera,
  Scene,
  Vector3,
} from 'three'
import { Box, computed, onKeyDown, ref, Text, useTerminalSize } from 'vue-termui'

const HEADER_HEIGHT = 4

const scene = new Scene()
scene.add(new AmbientLight(new Color(0.35, 0.35, 0.35), 1.0))

const keyLight = new DirectionalLight(new Color(1.0, 0.95, 0.9), 1.2)
keyLight.position.set(2.5, 2.0, 3.0)
scene.add(keyLight)

const fillLight = new DirectionalLight(new Color(0.5, 0.7, 1.0), 0.6)
fillLight.position.set(-2.0, -1.5, 2.5)
scene.add(fillLight)

const cube = new Mesh(
  new BoxGeometry(1, 1, 1),
  new MeshPhongMaterial({
    color: new Color(0.25, 0.8, 1.0),
    shininess: 80,
    specular: new Color(0.9, 0.9, 1.0),
  }),
)
scene.add(cube)

const camera = new PerspectiveCamera(45, 1, 0.1, 100)
camera.position.set(0, 0, 3)

const { width: cols, height: rows } = useTerminalSize()
const boxWidth = computed(() => Math.max(24, Math.min(64, Math.floor(cols.value * 0.55))))
const boxHeight = computed(() => Math.max(12, Math.min(28, Math.floor(rows.value * 0.55))))

const left = ref(2)
const top = ref(HEADER_HEIGHT)
let dragging = false
let dragOffsetX = 0
let dragOffsetY = 0

interface TuiMouseEvent {
  x: number
  y: number
  stopPropagation(): void
}

function onDown(event: TuiMouseEvent) {
  dragging = true
  dragOffsetX = event.x - left.value
  dragOffsetY = event.y - top.value
  event.stopPropagation()
}

function onDrag(event: TuiMouseEvent) {
  if (!dragging) return
  const maxX = cols.value - boxWidth.value
  const maxY = rows.value - boxHeight.value
  left.value = Math.max(0, Math.min(event.x - dragOffsetX, maxX))
  top.value = Math.max(HEADER_HEIGHT, Math.min(event.y - dragOffsetY, maxY))
  event.stopPropagation()
}

function onDragEnd() {
  dragging = false
}

const rotationSpeed = new Vector3(0.6, 0.4, 0.2)
const rotating = ref(true)

onFrame((deltaMs) => {
  if (!rotating.value) return
  const deltaTime = deltaMs / 1000
  cube.rotation.x += rotationSpeed.x * deltaTime
  cube.rotation.y += rotationSpeed.y * deltaTime
  cube.rotation.z += rotationSpeed.z * deltaTime
})

onKeyDown((key) => {
  if (key.name === 'space') rotating.value = !rotating.value
})
</script>

<template>
  <Box flexDirection="column">
    <Text>Draggable cube — drag it with the mouse, it stays transparent and live</Text>
    <Text dim>Space: toggle rotation ({{ rotating ? 'on' : 'off' }})</Text>
    <Box
      position="absolute"
      :left="left"
      :top="top"
      :width="boxWidth"
      :height="boxHeight"
      :zIndex="50"
      @mouse-down="onDown"
      @mouse-drag="onDrag"
      @mouse-drag-end="onDragEnd"
    >
      <Three
        :scene="scene"
        :camera="camera"
        :renderer-options="{
          focalLength: 8,
          alpha: true,
          backgroundColor: RGBA.fromValues(0, 0, 0, 0),
        }"
      />
    </Box>
  </Box>
</template>
