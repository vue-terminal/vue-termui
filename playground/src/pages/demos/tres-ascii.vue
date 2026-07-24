<script setup lang="ts">
// The TresJS docs demo scene (cone/box/sphere floating over a plane), but
// drawn through SuperSampleType.ASCII: by default the 'shape' style matches
// each cell's light distribution against glyph shape vectors (after
// https://alexharri.com/blog/ascii-rendering); 'ramp' maps luminance to glyph
// density. Colors only carry the hue either way. Same hand-rolled orbit
// controls as tres.vue — cientos' <OrbitControls> rides DOM pointer events
// that never fire in a TTY. Two departures from tres.vue's look: phong
// materials instead of toon (smooth shading gradients feed the glyphs; toon's
// flat bands collapse to a single glyph per face) and a black background
// instead of teal (empty space must be dark or every idle cell fills with
// dense glyphs).
import {
  onFrame,
  RGBA,
  SuperSampleType,
  type AsciiStyle,
  type ThreeRenderable,
} from '@vue-termui/three'
import {
  DoubleSide,
  Spherical,
  Vector3,
  type DirectionalLight,
  type PerspectiveCamera,
} from 'three'
import { Box, computed, onKeyDown, ref, shallowRef, Text, useTerminalSize } from 'vue-termui'
import { asciiRamps } from '../../ascii-ramps'
import TresTerminal from '../../components/TresTerminal.vue'
import type { MouseEvent } from '@opentui/core'

const { height: rows } = useTerminalSize()
const sceneHeight = computed(() => Math.max(8, rows.value - 10))

const tres = shallowRef<{ renderable: ThreeRenderable | null } | null>(null)

const backgroundColor = RGBA.fromValues(0, 0, 0, 1)

const mode = ref<SuperSampleType>(SuperSampleType.ASCII)
const style = ref<AsciiStyle>('shape')
const contrast = ref(2)
// full charset by default: the shape style picks glyphs by ink position, so
// the more shapes to choose from the better
const rampIndex = ref(asciiRamps.findIndex((ramp) => ramp.name === 'full'))

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

let dragMode: 'orbit' | 'pan' | null = null
let lastX = 0
let lastY = 0

function startCameraControl(event: MouseEvent, nextMode: 'orbit' | 'pan') {
  dragMode = nextMode
  lastX = event.x
  lastY = event.y
}

function updateCameraControl(event: MouseEvent) {
  if (!dragMode) return
  const dx = event.x - lastX
  const dy = event.y - lastY
  lastX = event.x
  lastY = event.y
  if (dragMode === 'orbit') {
    spherical.theta -= dx * ROTATE_SPEED
    spherical.phi -= dy * ROTATE_SPEED * 2
    spherical.phi = Math.min(MAX_POLAR, Math.max(MIN_POLAR, spherical.phi))
  } else {
    pan(dx, dy)
  }
  applyOrbit()
}

function stopCameraControl() {
  dragMode = null
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
  const renderer = tres.value?.renderable?.renderer
  if (!renderer) return
  if (key.name === 'm') {
    renderer.toggleSuperSampling()
    mode.value = renderer.getSuperSample()
  } else if (key.name === 'a') {
    rampIndex.value = (rampIndex.value + 1) % asciiRamps.length
    renderer.setAsciiChars(asciiRamps[rampIndex.value]!.chars)
  } else if (key.name === 's') {
    style.value = style.value === 'shape' ? 'ramp' : 'shape'
    renderer.setAsciiStyle(style.value)
  } else if (key.name === 'c') {
    contrast.value = (contrast.value % 4) + 1
    renderer.setAsciiContrast(contrast.value)
  }
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
    <Text
      >TresJS in ASCII — glyphs picked by shape vectors (alexharri.com/blog/ascii-rendering)</Text
    >
    <Text dim
      >Drag: orbit · Right drag: pan · Scroll: zoom · M: mode ({{ mode }}) · S: style ({{ style }})
      · A: chars ({{ asciiRamps[rampIndex]!.name }}) · C: contrast ({{ contrast }})</Text
    >
    <Box
      :border="true"
      title="tres ascii"
      width="100%"
      :height="sceneHeight"
      @mouse-down.left.stop="startCameraControl($event, 'orbit')"
      @mouse-down.right.stop="startCameraControl($event, 'pan')"
      @mouse-down.middle.stop="startCameraControl($event, 'pan')"
      @mouse-drag.stop="updateCameraControl"
      @mouse-drag-end="stopCameraControl"
      @mouse-scroll.stop="zoomCamera"
    >
      <TresTerminal
        ref="tres"
        :rendererOptions="{
          backgroundColor,
          shadows: true,
          superSample: SuperSampleType.ASCII,
          asciiChars: asciiRamps[rampIndex]!.chars,
        }"
      >
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
          <TresMeshPhongMaterial color="#82DBC5" :shininess="40" specular="#DDDDDD" />
        </TresMesh>
        <TresMesh :position="[0, 4, 0]" cast-shadow>
          <TresBoxGeometry :args="[1.5, 1.5, 1.5]" />
          <TresMeshPhongMaterial color="#7F7F7F" :shininess="60" specular="#FFFFFF" />
        </TresMesh>
        <TresMesh :position="[2, 2, 0]" cast-shadow>
          <TresSphereGeometry />
          <TresMeshPhongMaterial color="#FBB03B" :shininess="40" specular="#DDDDDD" />
        </TresMesh>
        <TresDirectionalLight :position="[0, 8, 4]" :intensity="0.7" cast-shadow />
        <TresMesh :rotation="[-Math.PI / 2, 0, 0]" receive-shadow>
          <TresPlaneGeometry :args="[10, 10, 10, 10]" />
          <TresMeshPhongMaterial color="#D3FC8A" :shininess="10" specular="#333333" />
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
