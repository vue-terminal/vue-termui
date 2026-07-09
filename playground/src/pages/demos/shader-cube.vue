<script setup lang="ts">
// Port of opentui's shader-cube-demo (trimmed: no buffer post-processing
// filters): a phong-shaded cube with procedural TextureUtils materials, an
// orbiting point light with visualizer, and live material/light cycling.
import { onFrame, RGBA, TextureUtils, Three } from '@vue-termui/three'
import {
  AmbientLight,
  BoxGeometry,
  Color,
  DirectionalLight,
  Mesh,
  MeshPhongMaterial,
  PerspectiveCamera,
  PointLight,
  Scene,
} from 'three'
import { Box, computed, onKeyDown, ref, Text, useTerminalSize } from 'vue-termui'

const scene = new Scene()

const mainLight = new DirectionalLight(new Color(1, 1, 1), 0.8)
mainLight.position.set(-10, -5, 1)
mainLight.target.position.set(0, 0, 0)
scene.add(mainLight, mainLight.target)

const pointLight = new PointLight(new Color(1, 220 / 255, 180 / 255), 2.0, 4)
pointLight.position.set(1.5, 0, 0)
scene.add(pointLight)

scene.add(new AmbientLight(new Color(0.25, 0.25, 0.25), 1))

// small emissive cube marking the point light position
const lightViz = new Mesh(
  new BoxGeometry(0.2, 0.2, 0.2),
  new MeshPhongMaterial({
    color: 0x00_00_00,
    emissive: new Color(1.0, 0.8, 0.4),
    emissiveIntensity: 1.0,
    shininess: 0,
  }),
)
lightViz.position.copy(pointLight.position)
scene.add(lightViz)

function checkerboard(bright: [number, number, number], dark: [number, number, number]) {
  return TextureUtils.createCheckerboard(
    256,
    new Color(bright[0] / 255, bright[1] / 255, bright[2] / 255),
    new Color(dark[0] / 255, dark[1] / 255, dark[2] / 255),
  )
}

const specularMap = TextureUtils.createGradient(
  256,
  new Color(1, 1, 1),
  new Color(0.2, 0.2, 0.2),
  'horizontal',
)
const emissiveMap = TextureUtils.createGradient(
  256,
  new Color(1, 0.6, 0),
  new Color(0, 0, 0),
  'radial',
)
const normalMap = TextureUtils.createNoise(
  256,
  2,
  3,
  new Color(127 / 255, 127 / 255, 1),
  new Color(127 / 255, 127 / 255, 127 / 255),
)

const materialNames = ['red', 'green', 'blue', 'yellow', 'cyan', 'magenta', 'plain white']
const materials: MeshPhongMaterial[] = [
  checkerboard([255, 40, 40], [180, 10, 10]),
  checkerboard([40, 255, 40], [10, 180, 10]),
  checkerboard([40, 40, 255], [10, 10, 180]),
  checkerboard([255, 255, 40], [180, 180, 10]),
  checkerboard([40, 255, 255], [10, 180, 180]),
  checkerboard([255, 40, 255], [180, 10, 180]),
].map((map) => new MeshPhongMaterial({ map, shininess: 30, specular: new Color(0.8, 0.8, 0.8) }))
materials.push(
  new MeshPhongMaterial({ color: new Color(1, 1, 1), specular: new Color(1, 1, 1), shininess: 80 }),
)

const cube = new Mesh(new BoxGeometry(1, 1, 1), materials[0])
scene.add(cube)

const camera = new PerspectiveCamera(45, 1, 1.0, 100.0)
camera.position.set(0, 0, 3.5)

const lightColors = [
  { color: [255, 220, 180], name: 'Warm' },
  { color: [180, 220, 255], name: 'Cool' },
  { color: [255, 100, 100], name: 'Red' },
  { color: [100, 255, 100], name: 'Green' },
  { color: [100, 100, 255], name: 'Blue' },
  { color: [255, 255, 100], name: 'Yellow' },
] as const

const rotating = ref(true)
const materialIndex = ref(0)
const lightColorIndex = ref(0)
const specularOn = ref(false)
const emissiveOn = ref(false)
const normalOn = ref(false)

function currentMaterial(): MeshPhongMaterial {
  return materials[materialIndex.value]!
}

function applyMaps() {
  const material = currentMaterial()
  material.specularMap = specularOn.value ? specularMap : null
  material.emissiveMap = emissiveOn.value ? emissiveMap : null
  if (emissiveOn.value) material.emissive = new Color(1, 0.6, 0)
  else material.emissive = new Color(0, 0, 0)
  material.normalMap = normalOn.value ? normalMap : null
  material.needsUpdate = true
}

onKeyDown((key) => {
  if (key.name === 'space') {
    rotating.value = !rotating.value
  } else if (key.name === 'm') {
    materialIndex.value = (materialIndex.value + 1) % materials.length
    cube.material = currentMaterial()
    applyMaps()
  } else if (key.name === 'c') {
    lightColorIndex.value = (lightColorIndex.value + 1) % lightColors.length
    const [r, g, b] = lightColors[lightColorIndex.value]!.color
    pointLight.color.setRGB(r / 255, g / 255, b / 255)
    ;(lightViz.material as MeshPhongMaterial).emissive.setRGB(r / 255, g / 255, b / 255)
  } else if (key.name === 't') {
    specularOn.value = !specularOn.value
    applyMaps()
  } else if (key.name === 'e') {
    emissiveOn.value = !emissiveOn.value
    applyMaps()
  } else if (key.name === 'n') {
    normalOn.value = !normalOn.value
    applyMaps()
  }
})

let time = 0
onFrame((deltaMs) => {
  const deltaTime = deltaMs / 1000
  time += deltaTime

  if (rotating.value) {
    cube.rotation.x += 0.2 * deltaTime
    cube.rotation.y += 0.4 * deltaTime
    cube.rotation.z += 0.1 * deltaTime
  }

  // orbit the point light around the cube
  pointLight.position.set(1.5 * Math.cos(time), 1.5 * Math.sin(time * 0.7), 1.5 * Math.sin(time))
  lightViz.position.copy(pointLight.position)
})

const { height: rows } = useTerminalSize()
const sceneHeight = computed(() => Math.max(8, rows.value - 11))
</script>

<template>
  <Box flexDirection="column">
    <Text>Shader cube — phong materials from procedural TextureUtils textures</Text>
    <Text dim
      >Space: rotation ({{ rotating ? 'on' : 'off' }}) | M: material ({{
        materialNames[materialIndex]
      }}) | C: light ({{ lightColors[lightColorIndex]!.name }})</Text
    >
    <Text dim
      >T: specular map ({{ specularOn ? 'on' : 'off' }}) | E: emissive ({{
        emissiveOn ? 'on' : 'off'
      }}) | N: normal ({{ normalOn ? 'on' : 'off' }})</Text
    >
    <Three
      :scene="scene"
      :camera="camera"
      width="100%"
      :height="sceneHeight"
      :renderer-options="{ focalLength: 8, backgroundColor: RGBA.fromValues(0, 0, 0, 1) }"
    />
  </Box>
</template>
