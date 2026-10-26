<script setup lang="ts">
// Port of the lab's GrassField: one instanced blade per cell of a jittered
// grid, colored from the ground splat map, swaying in the wind and crushed
// where the car's trample map is marked. The original's GLSL ShaderMaterial is
// rebuilt as TSL nodes, which is what three's WebGPU renderer runs.
import { useLoop } from '@tresjs/core'
import {
  Color,
  DoubleSide,
  Float32BufferAttribute,
  InstancedBufferAttribute,
  InstancedBufferGeometry,
  Mesh,
  Sphere,
  type Texture,
  Vector2,
  Vector3,
} from 'three'
import { ImprovedNoise } from 'three/examples/jsm/math/ImprovedNoise.js'
import {
  attribute,
  cos,
  dot,
  float,
  mix,
  positionGeometry,
  sin,
  texture,
  uniform,
  vec2,
  vec3,
  vec4,
} from 'three/tsl'
import { MeshBasicNodeMaterial } from 'three/webgpu'
import { shallowRef } from 'vue-termui'
import { loadTexture } from './textures'
import type { TrampleMap } from './trample'

type ArrayVec2 = [number, number]

const props = withDefaults(
  defineProps<{
    size?: number
    subdivisions?: number
    roadHalfWidth?: number
    roadLength?: number
    bladeWidth?: number
    bladeHeight?: number
    bladeHeightRandomness?: number
    shadowIntensity?: number
    /** Multiplies the splat color; stands in for scene lighting on this unlit material */
    tint?: string
    diffuse?: string
    windStrength?: number
    windFrequency?: number
    windSpeed?: number
    windDirection?: ArrayVec2
    trample?: TrampleMap | null
  }>(),
  {
    size: 100,
    subdivisions: 600,
    roadHalfWidth: 5,
    roadLength: 80,
    bladeWidth: 0.1,
    bladeHeight: 0.6,
    bladeHeightRandomness: 0.6,
    shadowIntensity: 0.5,
    tint: '#ffffff',
    diffuse: 'grass-splat.webp',
    windStrength: 0.12,
    windFrequency: 0.35,
    windSpeed: 1.6,
    windDirection: () => [1, 0.35],
    trample: null,
  },
)

// Blade template: 5 vertices / 3 triangles, tapering to a tip
// prettier-ignore
const BLADE_POSITIONS = new Float32Array([
  -1, 0, 0,
  1, 0, 0,
  -0.5, 0.7, 0,
  0.5, 0.7, 0,
  0, 1, 0,
])
const BLADE_TIPNESS = new Float32Array([0, 0, 0.7, 0.7, 1])
const BLADE_INDICES = [0, 1, 2, 1, 3, 2, 2, 3, 4]
const BLADE_NORMALS = new Float32Array(BLADE_TIPNESS.length * 3).map((_, i) =>
  i % 3 === 1 ? 1 : 0,
)

const noise = new ImprovedNoise()

function buildGeometry() {
  const { size, subdivisions, roadHalfWidth, roadLength } = props
  const half = size / 2
  const cell = size / subdivisions
  const roadHalfLength = roadLength / 2
  const roadMargin = roadHalfWidth + props.bladeWidth

  const anchors: number[] = []
  const randoms: number[] = []
  const yaws: number[] = []
  const heightNoises: number[] = []
  const colorNoises: number[] = []

  for (let ix = 0; ix < subdivisions; ix++) {
    for (let iz = 0; iz < subdivisions; iz++) {
      const x = -half + (ix + Math.random()) * cell
      const z = -half + (iz + Math.random()) * cell

      // Skip the central road strip
      if (Math.abs(x) < roadMargin && Math.abs(z) < roadHalfLength) continue

      anchors.push(x, z)
      randoms.push(Math.random())
      yaws.push(Math.random() * Math.PI * 2)

      const h = noise.noise(x * 0.15, z * 0.15, 0)
      heightNoises.push(0.5 + (h * 0.5 + 0.5))

      const c = noise.noise(x * 0.08 + 100, z * 0.08 + 100, 50)
      colorNoises.push(Math.min(1, Math.max(0, c * 0.5 + 0.5)))
    }
  }

  const geometry = new InstancedBufferGeometry()
  geometry.instanceCount = randoms.length
  geometry.setAttribute('position', new Float32BufferAttribute(BLADE_POSITIONS, 3))
  geometry.setAttribute('tipness', new Float32BufferAttribute(BLADE_TIPNESS, 1))
  // unlit, but three's node builder still reads a normal
  geometry.setAttribute('normal', new Float32BufferAttribute(BLADE_NORMALS, 3))
  geometry.setIndex(BLADE_INDICES)
  geometry.setAttribute('anchor', new InstancedBufferAttribute(new Float32Array(anchors), 2))
  geometry.setAttribute('random', new InstancedBufferAttribute(new Float32Array(randoms), 1))
  geometry.setAttribute('yaw', new InstancedBufferAttribute(new Float32Array(yaws), 1))
  geometry.setAttribute(
    'heightNoise',
    new InstancedBufferAttribute(new Float32Array(heightNoises), 1),
  )
  geometry.setAttribute(
    'colorNoise',
    new InstancedBufferAttribute(new Float32Array(colorNoises), 1),
  )

  // Instanced bounding sphere is unreliable; keep it generous and skip culling
  geometry.boundingSphere = new Sphere(new Vector3(0, 0, 0), half * 1.5)

  return geometry
}

const geometry = buildGeometry()

const uTime = uniform(0)
const uBladeWidth = uniform(props.bladeWidth)
const uBladeHeight = uniform(props.bladeHeight)
const uBladeHeightRandomness = uniform(props.bladeHeightRandomness)
const uShadowIntensity = uniform(props.shadowIntensity)
const uTint = uniform(new Color(props.tint))
const uFieldSize = uniform(props.size)
const uWindStrength = uniform(props.windStrength)
const uWindFrequency = uniform(props.windFrequency)
const uWindSpeed = uniform(props.windSpeed)
const uWindDirection = uniform(new Vector2(...props.windDirection).normalize())

const tipness = attribute<'float'>('tipness', 'float')
const anchor = attribute<'vec2'>('anchor', 'vec2')
const random = attribute<'float'>('random', 'float')
const yaw = attribute<'float'>('yaw', 'float')
const heightNoise = attribute<'float'>('heightNoise', 'float')
const colorNoise = attribute<'float'>('colorNoise', 'float')

function createMaterial(diffuse: Texture) {
  const material = new MeshBasicNodeMaterial({ side: DoubleSide })

  // Trample: sample the car's world-aligned trail at this blade's anchor
  // (explicit level: the vertex stage has no derivatives to pick a mip from)
  const { trample: map } = props
  const trample = map
    ? texture(map.texture, anchor.sub(vec2(map.originX, map.originZ)).div(map.size).add(0.5)).level(
        0,
      ).r
    : float(0)

  // Dual-frequency height: per-blade randomness x baked patch noise,
  // crushed where trampled (down to 25% height under a full stamp)
  const height = uBladeHeight
    .mul(mix(1, random, uBladeHeightRandomness))
    .mul(heightNoise)
    .mul(float(1).sub(trample.mul(0.75)))

  // Random yaw around the blade base (the template's z is 0)
  const localX = positionGeometry.x.mul(uBladeWidth)
  const rotated = vec2(localX.mul(cos(yaw)), localX.mul(sin(yaw)))

  // Wind: traveling wave across the field, bend scales with tipness so the
  // base stays planted and the tip travels furthest (bend, not shear).
  // Pinned-down trampled blades barely sway
  const phase = dot(anchor, uWindDirection).mul(uWindFrequency).add(uTime.mul(uWindSpeed))
  const wave = sin(phase).add(sin(phase.mul(2.3).add(1.7)).mul(0.5))
  const bend = uWindDirection.mul(wave.mul(uWindStrength).mul(tipness).mul(float(1).sub(trample)))

  material.positionNode = vec3(
    rotated.x.add(anchor.x).add(bend.x),
    positionGeometry.y.mul(height),
    rotated.y.add(anchor.y).add(bend.y),
  )

  // Base color comes from the ground splat map, sampled at the blade anchor,
  // with subtle per-blade variation so neighbours sampling the same texel differ
  const base = texture(diffuse, anchor.div(uFieldSize).add(0.5)).rgb.mul(
    mix(0.85, 1.15, colorNoise),
  )
  // Darkening the base fakes ambient occlusion: dense grass is darker at the soil
  const ao = float(1).sub(tipness).mul(uShadowIntensity)
  // Unlit material: the tint stands in for scene lighting (e.g. night)
  material.colorNode = vec4(mix(base, base.mul(0.35), ao).mul(uTint), 1)

  return material
}

// Drawn once the splat map is in, as the original's v-if on the texture did
const grassMesh = shallowRef<Mesh | null>(null)

void loadTexture(props.diffuse).then((diffuse) => {
  const mesh = new Mesh(geometry, createMaterial(diffuse))
  mesh.frustumCulled = false
  grassMesh.value = mesh
})

const { onBeforeRender } = useLoop()
onBeforeRender(({ elapsed }) => {
  uTime.value = elapsed
})
</script>

<template>
  <primitive v-if="grassMesh" :object="grassMesh" />
</template>
