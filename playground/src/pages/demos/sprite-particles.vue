<script setup lang="ts">
// Port of opentui's sprite-particle-generator-demo: GPU-instanced sprite
// particles (static hearts / animated running character) over a background
// sprite, with burst and auto-spawn modes.
import {
  onFrame,
  RGBA,
  SpriteAnimator,
  SpriteParticleGenerator,
  SpriteResourceManager,
  Three,
  type ParticleEffectParameters,
} from '@vue-termui/three'
import { fileURLToPath } from 'node:url'
import { MathUtils, PerspectiveCamera, Scene, Vector2, Vector3 } from 'three'
import { Box, computed, onKeyDown, ref, Text, useTerminalSize } from 'vue-termui'

function asset(name: string): string {
  return fileURLToPath(new URL(`../../assets/sprites/${name}`, import.meta.url))
}

const scene = new Scene()

const camera = new PerspectiveCamera(75, 1, 0.1, 1000)
camera.position.set(0, 0, 3)
camera.lookAt(0, 0, 0)
scene.add(camera)

const AUTO_SPAWN_RATE = 30

const status = ref('Loading sprite resources…')
const particleCount = ref(0)
const modeName = ref('3D Static')
const autoSpawning = ref(true)

const resourceManager = new SpriteResourceManager(scene)
const spriteAnimator = new SpriteAnimator(scene)

interface Mode {
  name: string
  params: ParticleEffectParameters
  generator: SpriteParticleGenerator
}

const modes: Record<string, Mode> = {}
let currentMode: Mode | undefined

// shared physics for every mode; each entry below only overrides what differs
function baseParams(resource: ParticleEffectParameters['resource']): ParticleEffectParameters {
  return {
    resource,
    scale: 0.7,
    renderOrder: 1,
    maxParticles: 3000,
    lifetimeMsMin: 2000,
    lifetimeMsMax: 5000,
    origins: [
      new Vector3(-1, 0, 0),
      new Vector3(1, 0, 0),
      new Vector3(0, 1, 0),
      new Vector3(0, -1, 0),
    ],
    spawnRadius: new Vector3(0.1, 0.1, 0),
    initialVelocityMin: new Vector3(-0.5, 2, 0),
    initialVelocityMax: new Vector3(0.5, 3.5, 0),
    angularVelocityMin: new Vector3(-Math.PI, -Math.PI, -Math.PI),
    angularVelocityMax: new Vector3(Math.PI, Math.PI, Math.PI),
    gravity: new Vector3(0, -2.0, 0),
    randomGravityFactorMinMax: new Vector2(0.8, 1.2),
    scaleOverLifeMinMax: new Vector2(1.0, 0.1),
    fadeOut: true,
  }
}

const ready = (async () => {
  const heart = await resourceManager.createResource({
    imagePath: asset('heart.png'),
    sheetNumFrames: 1,
  })
  const runningChar = await resourceManager.createResource({
    imagePath: asset('main_char_run_loop.png'),
    sheetNumFrames: 10,
  })
  const background = await resourceManager.createResource({
    imagePath: asset('forrest_background.png'),
    sheetNumFrames: 1,
  })

  const backgroundSprite = await spriteAnimator.createSprite({
    initialAnimation: 'idle',
    animations: {
      idle: { resource: background, animNumFrames: 1, frameDuration: 1000, loop: false },
    },
    scale: 5.0,
    renderOrder: 0,
  })
  backgroundSprite?.setPosition(new Vector3(0, 0, 0))

  const define = (key: string, name: string, params: ParticleEffectParameters) => {
    modes[key] = { name, params, generator: new SpriteParticleGenerator(scene, params) }
  }

  define('3d-static', '3D Static', baseParams(heart))
  define('2d-static', '2D Static', {
    ...baseParams(heart),
    origins: [new Vector3(0, 0, 0)],
    angularVelocityMin: new Vector3(0, 0, -Math.PI),
    angularVelocityMax: new Vector3(0, 0, Math.PI),
  })
  define('3d-animated', '3D Animated', {
    ...baseParams(runningChar),
    frameDuration: 80,
    scale: 1.5,
  })
  define('custom', 'Custom Gravity', baseParams(heart))
  define('2d-animated', '2D Animated', {
    ...baseParams(runningChar),
    frameDuration: 80,
    scale: 1.5,
    origins: [new Vector3(0, 0, 0.1)],
    angularVelocityMin: new Vector3(0, 0, -Math.PI),
    angularVelocityMax: new Vector3(0, 0, Math.PI),
  })

  currentMode = modes['3d-static']
  currentMode!.generator.setAutoSpawn(AUTO_SPAWN_RATE)
  status.value = "'g': burst | 'a': auto | 's': stop | 'x': clear | 1-5: mode"
})()
ready.catch((error) => {
  status.value = `Failed to load sprites: ${error}`
})

function switchMode(key: string) {
  const next = modes[key]
  if (!next || !currentMode || next === currentMode) return
  const wasAutoSpawning = currentMode.generator.hasAutoSpawn()
  currentMode.generator.stopAutoSpawn()
  currentMode = next
  if (wasAutoSpawning) currentMode.generator.setAutoSpawn(AUTO_SPAWN_RATE)
  modeName.value = currentMode.name
  autoSpawning.value = currentMode.generator.hasAutoSpawn()
}

onKeyDown((key) => {
  if (!currentMode) return
  if (key.name === 'g') {
    void currentMode.generator.spawnParticles(100)
  } else if (key.name === 'a') {
    currentMode.generator.setAutoSpawn(AUTO_SPAWN_RATE)
    autoSpawning.value = true
  } else if (key.name === 's') {
    currentMode.generator.stopAutoSpawn()
    autoSpawning.value = false
  } else if (key.name === 'x') {
    currentMode.generator.dispose()
  } else if (key.name === '1') {
    switchMode('3d-static')
  } else if (key.name === '2') {
    switchMode('2d-static')
  } else if (key.name === '3') {
    switchMode('3d-animated')
  } else if (key.name === '4') {
    modes.custom!.params.gravity = new Vector3(
      0,
      MathUtils.randFloat(-9.8, 9.8),
      MathUtils.randFloat(-2.0, 2.0),
    )
    switchMode('custom')
  } else if (key.name === '5') {
    switchMode('2d-animated')
  }
})

onFrame(async (deltaMs) => {
  spriteAnimator.update(deltaMs)
  await Promise.all(Object.values(modes).map((mode) => mode.generator.update(deltaMs)))
  if (currentMode) {
    particleCount.value = currentMode.generator.getActiveParticleCount()
  }
})

const { height: rows } = useTerminalSize()
const sceneHeight = computed(() => Math.max(8, rows.value - 10))
</script>

<template>
  <Box flexDirection="column">
    <Text>Sprite particles — {{ status }}</Text>
    <Text dim
      >Mode: {{ modeName }} | {{ autoSpawning ? 'auto-spawning' : 'idle' }} | Particles:
      {{ particleCount }}</Text
    >
    <Three
      :scene="scene"
      :camera="camera"
      width="100%"
      :height="sceneHeight"
      :renderer-options="{ focalLength: 1, backgroundColor: RGBA.fromValues(0.1, 0.1, 0.2, 1) }"
    />
  </Box>
</template>
