<script setup lang="ts">
// Port of opentui's texture-loading-demo: a crate cube with color + emissive
// maps loaded from PNG files (TextureUtils/jimp) and free camera controls.
import { onFrame, RGBA, TextureUtils, Three, type ThreeRenderable } from '@vue-termui/three'
import { fileURLToPath } from 'node:url'
import { BoxGeometry, Color, Mesh, PerspectiveCamera, PointLight, Scene, Vector3 } from 'three'
import { lights } from 'three/tsl'
import { MeshPhongNodeMaterial } from 'three/webgpu'
import { Box, computed, onKeyDown, ref, Text, useTemplateRef, useTerminalSize } from 'vue-termui'

// Reads from src/assets in dev; in a build Vite rewrites this to the emitted
// dist/assets file (https://vite.dev/guide/assets#new-url-url-import-meta-url).
function asset(name: string): string {
  return fileURLToPath(new URL(`../../assets/sprites/${name}`, import.meta.url))
}

const scene = new Scene()

const mainLight = new PointLight(new Color(1, 1, 1), 1.0, 60)
mainLight.power = 500
mainLight.position.set(2, 1, 2)
scene.add(mainLight)

const fillLight = new PointLight(new Color(1, 1, 1), 1.0, 60)
fillLight.power = 500
fillLight.position.set(-2, 1, 2)
scene.add(fillLight)

const allLights = lights([mainLight, fillLight])

const cube = new Mesh(new BoxGeometry(1, 1, 1))
scene.add(cube)

const camera = new PerspectiveCamera(45, 1, 1.0, 100.0)
camera.position.set(0, 0, 2)

const status = ref('Loading textures…')
Promise.all([
  TextureUtils.fromFile(asset('crate.png')),
  TextureUtils.fromFile(asset('crate_emissive.png')),
])
  .then(([map, emissiveMap]) => {
    if (!map) {
      status.value = 'Texture failed to load.'
      return
    }
    const material = new MeshPhongNodeMaterial({
      map,
      emissiveMap: emissiveMap ?? undefined,
      emissive: new Color(0, 0, 0),
      emissiveIntensity: 0.2,
    })
    material.lightsNode = allLights
    cube.material = material
    status.value = 'PhongNodeMaterial with crate + emissive maps.'
  })
  .catch((error) => {
    status.value = `Failed to load textures: ${error}`
  })

const rotationSpeed = new Vector3(0.4, 0.8, 0.2)
const rotating = ref(true)

onFrame((deltaMs) => {
  if (!rotating.value) return
  const deltaTime = deltaMs / 1000
  cube.rotation.x += rotationSpeed.x * deltaTime
  cube.rotation.y += rotationSpeed.y * deltaTime
  cube.rotation.z += rotationSpeed.z * deltaTime
})

const three = useTemplateRef<{ renderable: ThreeRenderable | null }>('three')

onKeyDown((key) => {
  if (key.name === 'space') rotating.value = !rotating.value
  else if (key.name === 'w') camera.translateY(0.5)
  else if (key.name === 's') camera.translateY(-0.5)
  else if (key.name === 'a') camera.translateX(-0.5)
  else if (key.name === 'd') camera.translateX(0.5)
  else if (key.name === 'q') camera.rotateY(0.1)
  else if (key.name === 'e') camera.rotateY(-0.1)
  else if (key.name === 'z') camera.translateZ(0.1)
  else if (key.name === 'x') camera.translateZ(-0.1)
  else if (key.name === 'u') three.value?.renderable?.renderer.toggleSuperSampling()
  else if (key.name === 'r') {
    camera.position.set(0, 0, 2)
    camera.rotation.set(0, 0, 0)
    camera.quaternion.set(0, 0, 0, 1)
    camera.up.set(0, 1, 0)
    camera.lookAt(0, 0, 0)
  }
})

const { height: rows } = useTerminalSize()
const sceneHeight = computed(() => Math.max(8, rows.value - 10))
</script>

<template>
  <Box flexDirection="column">
    <Text>Texture loading — {{ status }}</Text>
    <Text dim
      >WASD: move | QE: rotate | ZX: zoom | R: reset | U: supersampling | Space: rotation ({{
        rotating ? 'on' : 'off'
      }})</Text
    >
    <Three
      ref="three"
      :scene="scene"
      :camera="camera"
      width="100%"
      :height="sceneHeight"
      :renderer-options="{ focalLength: 8, backgroundColor: RGBA.fromValues(0, 0, 0, 1) }"
    />
  </Box>
</template>
