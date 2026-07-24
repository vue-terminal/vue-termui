<script setup lang="ts">
// Terminal port of the shaders.com "Northern Lights" preset
// (Swirl background + Aurora ribbon + FilmGrain), rebuilt as a TSL
// fragment shader on a full-viewport plane like the fractal demo.
import { onFrame, Three, type ThreeRenderable } from '@vue-termui/three'
import { Mesh, PerspectiveCamera, PlaneGeometry, Scene, Vector2 } from 'three'
import {
  atan,
  clamp,
  dot,
  exp,
  float,
  Fn,
  fract,
  length,
  mix,
  screenCoordinate,
  sin,
  smoothstep,
  uniform,
  vec2,
  vec3,
  vec4,
} from 'three/tsl'
import { MeshBasicNodeMaterial } from 'three/webgpu'
import { Box, computed, onKeyDown, ref, Text, useTemplateRef, useTerminalSize } from 'vue-termui'

const scene = new Scene()
const camera = new PerspectiveCamera(45, 1, 0.1, 100.0)
camera.position.set(0, 0, 5)

const timeUniform = uniform(0.0)
const resolutionUniform = uniform(new Vector2(1, 1))
const cellAspectRatio = uniform(2.0)

const auroraMaterial = new MeshBasicNodeMaterial()

auroraMaterial.colorNode = Fn(() => {
  const FC = screenCoordinate
  const r = resolutionUniform
  const t = timeUniform

  // uv with y up; x stretched to real aspect so the waves keep their shape
  const uv = vec2(FC.x.div(r.x), float(1.0).sub(FC.y.div(r.y)))
  const aspect = r.x.div(r.y.mul(cellAspectRatio))
  const px = uv.x.mul(aspect)
  const y = uv.y

  // preset palette (#8d54ff / #29ff8d / #1122d9 on #0b1329 / #0c0f17)
  const purple = vec3(0.553, 0.329, 1.0)
  const green = vec3(0.161, 1.0, 0.553)
  const blue = vec3(0.067, 0.133, 0.851)
  const bgA = vec3(0.043, 0.075, 0.161)
  const bgB = vec3(0.047, 0.059, 0.09)

  // Swirl: slow angular gradient around the preset's center (0.33, 0.36)
  const q = vec2(px.sub(aspect.mul(0.33)), y.sub(0.36))
  const swirl = sin(atan(q.y, q.x).mul(1.6).add(length(q).mul(3.0)).sub(t.mul(0.08)))
    .mul(0.5)
    .add(0.5)
  const bg = mix(bgA, bgB, swirl)

  // Aurora: additive (linearDodge) wavy bands, green core fading to purple
  // above and deep blue below, with faint vertical ray streaks
  const band = (
    yCenter: number,
    width: number,
    amp: number,
    freq: number,
    speed: number,
    phase: number,
    gain: number,
  ) => {
    const curve = float(yCenter)
      .add(sin(px.mul(freq).add(t.mul(speed)).add(phase)).mul(amp))
      .add(
        sin(
          px
            .mul(freq * 2.17)
            .sub(t.mul(speed * 0.6))
            .add(phase * 2.7),
        ).mul(amp * 0.45),
      )
    const d = y.sub(curve).div(width)
    // slower falloff above the curve so the purple rim stays visible
    const spread = mix(float(1.0), float(0.3), smoothstep(float(0.0), float(1.0), d))
    const glow = exp(d.mul(d).mul(spread).negate())
    const rays = sin(px.mul(38.0).add(curve.mul(14.0)).add(t.mul(0.4)))
      .mul(0.12)
      .add(0.88)
    const col = mix(
      mix(green, purple, smoothstep(float(0.15), float(1.2), d)),
      blue,
      smoothstep(float(0.0), float(2.2), d.negate()),
    )
    return col.mul(glow).mul(rays).mul(gain)
  }

  const aurora = band(0.55, 0.1, 0.1, 3.0, 0.3, 0.0, 0.9)
    .add(band(0.68, 0.055, 0.07, 4.3, 0.42, 2.1, 0.55))
    .add(band(0.42, 0.16, 0.06, 2.2, 0.22, 4.0, 0.35))

  // FilmGrain strength 0.1
  const grain = fract(sin(dot(FC.xy.add(t.mul(60.0)), vec2(12.9898, 78.233))).mul(43_758.5453))
    .sub(0.5)
    .mul(0.1)

  const color = clamp(bg.add(aurora).add(grain), 0.0, 1.0)
  return vec4(color, 1.0)
})()

const planeMesh = new Mesh(new PlaneGeometry(10, 10), auroraMaterial)
planeMesh.name = 'aurora_plane'
scene.add(planeMesh)

const three = useTemplateRef<{ renderable: ThreeRenderable | null }>('three')

let time = 0
const speed = ref(1.0)
const paused = ref(false)

onFrame((deltaMs) => {
  if (!paused.value) {
    time += (deltaMs / 1000) * speed.value
    timeUniform.value = time
  }
  // screenCoordinate is in render-target pixels: the renderable's cell size
  // doubled by GPU supersampling
  const renderable = three.value?.renderable
  if (renderable) {
    resolutionUniform.value.set(renderable.width * 2, renderable.height * 2)
  }
})

onKeyDown((key) => {
  if (key.name === 'space') {
    paused.value = !paused.value
  } else if (key.name === '+' || key.name === '=') {
    speed.value = Math.min(speed.value + 0.1, 3.0)
  } else if (key.name === '-' || key.name === '_') {
    speed.value = Math.max(speed.value - 0.1, 0.1)
  } else if (key.name === 'r') {
    time = 0
    speed.value = 1.0
    paused.value = false
  } else if (key.name === 'p') {
    three.value?.renderable?.renderer.saveToFile(`aurora-${Date.now()}.png`)
  }
})

const { height: rows } = useTerminalSize()
const sceneHeight = computed(() => Math.max(8, rows.value - 10))
</script>

<template>
  <Box flexDirection="column">
    <Text
      >Northern Lights — shaders.com preset ported to TSL — Space: pause | +/-: speed | R: reset |
      P: screenshot — Speed: {{ speed.toFixed(1) }}x{{ paused ? ' (paused)' : '' }}</Text
    >
    <Three ref="three" :scene="scene" :camera="camera" width="100%" :height="sceneHeight" />
  </Box>
</template>
