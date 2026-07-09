<script setup lang="ts">
// Port of opentui's fractal-shader-demo (shader by @XorDev): a TSL fractal
// raymarcher on a full-viewport plane, rendered with WebGPU into the terminal.
import { onFrame, Three, type ThreeRenderable } from '@vue-termui/three'
import { Mesh, PerspectiveCamera, PlaneGeometry, Scene, Vector2 } from 'three'
import {
  atan,
  ceil,
  cos,
  float,
  Fn,
  int,
  length,
  Loop,
  normalize,
  screenCoordinate,
  sin,
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

const fractalMaterial = new MeshBasicNodeMaterial()

fractalMaterial.colorNode = Fn(() => {
  const FC = screenCoordinate
  const r = resolutionUniform
  const t = timeUniform

  const z = float(0.0).toVar()
  const d = float(0.0).toVar()
  const i = float(0.0).toVar()
  const o = vec4(0.0).toVar()

  Loop({ start: int(1), end: int(90), type: 'int', condition: '<' }, ({ i: loopI }) => {
    i.assign(float(loopI))

    const correctedFC = vec2(FC.x, FC.y.mul(cellAspectRatio))
    const FCrgb = vec3(correctedFC.x, correctedFC.y, float(0.0))
    const rxyx = vec3(r.x, r.y.mul(cellAspectRatio), r.x)
    const p = z.mul(normalize(FCrgb.mul(2.0).sub(rxyx))).toVar()

    p.assign(vec3(atan(p.y, p.x), p.z.div(3.0).sub(t), length(p.xy).sub(9.0)))

    Loop({ start: int(1), end: int(5), type: 'int', condition: '<' }, ({ i: innerI }) => {
      const dValue = float(innerI)
      d.assign(dValue)

      const iVec = i.mul(vec3(0.2, 0.0, 0.0))
      const pyzx = vec3(p.y, p.z, p.x)
      const arg = pyzx.mul(dValue).sub(iVec)
      const distortion = sin(ceil(arg)).div(dValue)
      p.addAssign(distortion)
    })

    const cos6p = cos(p.mul(6.0))
    const cosTerm = cos6p.mul(0.2).sub(0.2)
    const distanceVec = vec4(cosTerm.x, cosTerm.y, cosTerm.z, p.z)
    const dNew = length(distanceVec).mul(0.2)
    d.assign(dNew)
    z.addAssign(dNew)

    const colorPhase = vec4(0.0, 0.5, 1.0, 0.0)
    const cosResult = cos(p.x.add(colorPhase))
    const colorContrib = cosResult.add(1.0).div(d).div(z)
    o.addAssign(colorContrib)
  })

  const oSquared = o.mul(o)
  const processed = oSquared.div(800.0)

  // tanh approximation to compress the accumulated color into [0, 1]
  const x = processed
  const x2 = x.mul(x)
  const tanhApprox = x.mul(x2.add(27.0)).div(x2.mul(9.0).add(27.0))

  return vec4(tanhApprox.rgb, 1.0)
})()

const planeMesh = new Mesh(new PlaneGeometry(10, 10), fractalMaterial)
planeMesh.name = 'fractal_plane'
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
    three.value?.renderable?.renderer.saveToFile(`fractal-${Date.now()}.png`)
  }
})

const { height: rows } = useTerminalSize()
const sceneHeight = computed(() => Math.max(8, rows.value - 10))
</script>

<template>
  <Box flexDirection="column">
    <Text
      >Shader by @XorDev — Space: pause | +/-: speed | R: reset | P: screenshot — Speed:
      {{ speed.toFixed(1) }}x{{ paused ? ' (paused)' : '' }}</Text
    >
    <Three ref="three" :scene="scene" :camera="camera" width="100%" :height="sceneHeight" />
  </Box>
</template>
