<script setup lang="ts">
// TresJS's docs demo scene (toon cone/box/sphere floating over a plane): the
// scene graph is declared with Tres components in the template while
// @vue-termui/three draws it into the terminal — see <TresTerminal>. Compared
// to the original TresCanvas version: clear-color maps to the renderer's
// backgroundColor, NoToneMapping is already the terminal default, and the
// camera aspect is owned by the terminal cell grid (autoAspect), so no
// :aspect prop.
//
// Orbit controls are hand-rolled: cientos' <OrbitControls> rides DOM pointer
// events that never fire in a TTY, so the viewport Box's mouse-drag/scroll
// events drive the camera over a spherical orbit around the target instead.
import { onFrame, RGBA, type ThreeRenderable } from '@vue-termui/three'
import {
  DoubleSide,
  Spherical,
  Vector3,
  type DirectionalLight,
  type PerspectiveCamera,
} from 'three'
import { Box, computed, onKeyDown, shallowRef, Text, useTerminalSize } from 'vue-termui'
import TresTerminal from '../../components/TresTerminal.vue'
import type { MouseEvent } from '@opentui/core'

const { height: rows } = useTerminalSize()
const sceneHeight = computed(() => Math.max(8, rows.value - 10))

const tres = shallowRef<{ renderable: ThreeRenderable | null } | null>(null)

const backgroundColor = RGBA.fromHex('#82DBC5')

// plain shallowRef bound via the string ref: useTemplateRef wraps the value in
// a dev-only readonly proxy, which blocks mutating the camera on drag
const camera = shallowRef<PerspectiveCamera | null>(null)

const INITIAL_POSITION = new Vector3(11, 11, 11)
// rad per terminal cell; rows count double since cells are ~2x taller than wide
const ROTATE_SPEED = 0.04
const ZOOM_STEP = 1.1
const MIN_RADIUS = 4
const MAX_RADIUS = 60
const MIN_POLAR = 0.1
const MAX_POLAR = Math.PI - 0.1

const orbitTarget = new Vector3(0, 0, 0)
const spherical = new Spherical().setFromVector3(INITIAL_POSITION)

function applyOrbit() {
  if (!camera.value) return
  camera.value.position.setFromSpherical(spherical).add(orbitTarget)
  camera.value.lookAt(orbitTarget)
}

let mode: 'orbit' | 'pan' | null = null
let lastX = 0
let lastY = 0

function startCameraControl(event: MouseEvent, nextMode: 'orbit' | 'pan') {
  mode = nextMode
  lastX = event.x
  lastY = event.y
}

function updateCameraControl(event: MouseEvent) {
  if (!mode) return
  const dx = event.x - lastX
  const dy = event.y - lastY
  lastX = event.x
  lastY = event.y
  if (mode === 'orbit') {
    spherical.theta -= dx * ROTATE_SPEED
    spherical.phi -= dy * ROTATE_SPEED * 2
    spherical.phi = Math.min(MAX_POLAR, Math.max(MIN_POLAR, spherical.phi))
  } else {
    pan(dx, dy)
  }
  applyOrbit()
}

function stopCameraControl() {
  mode = null
}

// Screen-space pan, OrbitControls-style: shift the orbit target along the
// camera's right/up axes so the scene follows the cursor. World units per row
// come from the vertical frustum size at the target's distance; columns count
// half a row since cells are ~2x taller than wide.
const panAxis = new Vector3()
function pan(dxCells: number, dyCells: number) {
  const cam = camera.value
  if (!cam) return
  const viewportRows = Math.max(1, sceneHeight.value - 2)
  const unitsPerRow = (2 * spherical.radius * Math.tan((cam.fov * Math.PI) / 360)) / viewportRows
  panAxis.setFromMatrixColumn(cam.matrix, 0)
  orbitTarget.addScaledVector(panAxis, -dxCells * unitsPerRow * 0.5)
  panAxis.setFromMatrixColumn(cam.matrix, 1)
  orbitTarget.addScaledVector(panAxis, dyCells * unitsPerRow)
}

function zoomCamera(event: MouseEvent) {
  const direction = event.scroll?.direction
  if (direction !== 'up' && direction !== 'down') return
  spherical.radius *= direction === 'up' ? 1 / ZOOM_STEP : ZOOM_STEP
  spherical.radius = Math.min(MAX_RADIUS, Math.max(MIN_RADIUS, spherical.radius))
  applyOrbit()
}

onKeyDown((key) => {
  if (key.name === 'u') tres.value?.renderable?.renderer.toggleSuperSampling()
})

// Tres's useLoop never fires in a TTY (see TresTerminal.vue) — onFrame drives
// the orbit instead. Plain shallowRef + string ref for the same readonly-proxy
// reason as the camera above.
const orbitLight = shallowRef<DirectionalLight | null>(null)
// radius clears everything: tallest geometry tops out at ~6.75 (cone at y=6)
// under the circle's apex, and at y=0 the circle sits at z=±8, past the 10x10
// plane's edge
const LIGHT_ORBIT_RADIUS = 8
const LIGHT_ORBIT_X = 2
const LIGHT_ORBIT_SPEED = 0.8 // rad/s
let lightAngle = 0

// circle in the YZ plane (around the X axis): the light passes over the plane
// then under it, so the scene pulses between lit and dark
onFrame((deltaMs) => {
  const light = orbitLight.value
  if (!light) return
  lightAngle += (deltaMs / 1000) * LIGHT_ORBIT_SPEED
  light.position.set(
    LIGHT_ORBIT_X,
    Math.cos(lightAngle) * LIGHT_ORBIT_RADIUS,
    Math.sin(lightAngle) * LIGHT_ORBIT_RADIUS,
  )
})
</script>

<template>
  <Box flexDirection="column">
    <Text>TresJS — declarative three.js components rendered by @vue-termui/three</Text>
    <Text dim>Drag: orbit · Right drag: pan · Scroll: zoom · U: supersampling</Text>
    <Box
      :border="true"
      title="tres"
      width="100%"
      :height="sceneHeight"
      @mouse-down.left.stop="startCameraControl($event, 'orbit')"
      @mouse-down.right.stop="startCameraControl($event, 'pan')"
      @mouse-down.middle.stop="startCameraControl($event, 'pan')"
      @mouse-drag.stop="updateCameraControl"
      @mouse-drag-end="stopCameraControl"
      @mouse-scroll.stop="zoomCamera"
    >
      <TresTerminal ref="tres" :rendererOptions="{ backgroundColor, shadows: true }">
        <TresPerspectiveCamera
          ref="camera"
          :position="[11, 11, 11]"
          :fov="45"
          :near="0.1"
          :far="1000"
          :look-at="[0, 0, 0]"
        />
        <TresMesh :position="[-2, 6, 0]" :rotation="[0, Math.PI, 0]" cast-shadow>
          <TresConeGeometry :args="[1, 1.5, 3]" />
          <TresMeshToonMaterial color="#82DBC5" />
        </TresMesh>
        <TresMesh :position="[0, 4, 0]" cast-shadow>
          <TresBoxGeometry :args="[1.5, 1.5, 1.5]" />
          <TresMeshToonMaterial color="#4F4F4F" />
        </TresMesh>
        <TresMesh :position="[2, 2, 0]" cast-shadow>
          <TresSphereGeometry />
          <TresMeshToonMaterial color="#FBB03B" />
        </TresMesh>
        <TresDirectionalLight :position="[0, 8, 4]" :intensity="0.7" cast-shadow />
        <TresMesh :rotation="[-Math.PI / 2, 0, 0]" receive-shadow>
          <TresPlaneGeometry :args="[10, 10, 10, 10]" />
          <TresMeshToonMaterial color="#D3FC8A" />
        </TresMesh>
        <TresAmbientLight :intensity="0.75" />
        <TresDirectionalLight
          ref="orbitLight"
          :position="[LIGHT_ORBIT_X, LIGHT_ORBIT_RADIUS, 0]"
          :intensity="2"
          cast-shadow
        >
          <!-- unlit marker showing where the light is; child of the light so it
          follows the orbit for free -->
          <TresMesh>
            <TresPlaneGeometry :args="[1, 1]" />
            <TresMeshBasicMaterial color="#FFDD55" :side="DoubleSide" />
          </TresMesh>
        </TresDirectionalLight>
      </TresTerminal>
    </Box>
  </Box>
</template>
