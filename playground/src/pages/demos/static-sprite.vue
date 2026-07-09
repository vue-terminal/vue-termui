<script setup lang="ts">
// Port of opentui's static-sprite-demo: an animated character from a
// spritesheet (SpriteUtils.sheetFromFile) on an orthographic camera.
import {
  onFrame,
  RGBA,
  SpriteUtils,
  Three,
  type SheetSprite,
  type ThreeRenderable,
} from '@vue-termui/three'
import { fileURLToPath } from 'node:url'
import { OrthographicCamera, Scene } from 'three'
import { Box, computed, onKeyDown, ref, Text, useTemplateRef, useTerminalSize } from 'vue-termui'

const spriteSheetPath = fileURLToPath(
  new URL('../../assets/sprites/main_char_idle.png', import.meta.url),
)

const scene = new Scene()

const FRUSTUM_SIZE = 1
const camera = new OrthographicCamera(
  -FRUSTUM_SIZE / 2,
  FRUSTUM_SIZE / 2,
  FRUSTUM_SIZE / 2,
  -FRUSTUM_SIZE / 2,
  0.1,
  1000,
)
camera.position.z = 5
scene.add(camera)

const TOTAL_FRAMES = 8
const status = ref('Loading sprite sheet…')
let sprite: SheetSprite | undefined
SpriteUtils.sheetFromFile(spriteSheetPath, TOTAL_FRAMES).then((loaded) => {
  sprite = loaded
  sprite.scale.set(2.0, 2.0, 2.0)
  scene.add(sprite)
  status.value = `${TOTAL_FRAMES}-frame sheet playing. U: toggle supersampling.`
})

const three = useTemplateRef<{ renderable: ThreeRenderable | null }>('three')

// step the sheet every 64ms; keep the ortho frustum matched to the cell aspect
let frameIndex = 0
let accumulated = 0
let lastAspect = 0
onFrame((deltaMs) => {
  accumulated += deltaMs
  if (sprite && accumulated > 64) {
    frameIndex = (frameIndex + 1) % TOTAL_FRAMES
    sprite.setIndex(frameIndex)
    accumulated = 0
  }

  const aspect = three.value?.renderable?.aspectRatio
  if (aspect && aspect !== lastAspect) {
    lastAspect = aspect
    camera.left = (-FRUSTUM_SIZE * aspect) / 2
    camera.right = (FRUSTUM_SIZE * aspect) / 2
    camera.updateProjectionMatrix()
  }
})

onKeyDown((key) => {
  if (key.name === 'u') three.value?.renderable?.renderer.toggleSuperSampling()
})

const { height: rows } = useTerminalSize()
const sceneHeight = computed(() => Math.max(8, rows.value - 9))
</script>

<template>
  <Box flexDirection="column">
    <Text>Static sprite — {{ status }}</Text>
    <Three
      ref="three"
      :scene="scene"
      :camera="camera"
      :auto-aspect="false"
      width="100%"
      :height="sceneHeight"
      :renderer-options="{ focalLength: 1, backgroundColor: RGBA.fromValues(0.2, 0.1, 0.3, 1) }"
    />
  </Box>
</template>
