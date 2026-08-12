<script setup lang="ts">
// rapier.tresjs.org's docs demo in a terminal: @tresjs/rapier's <Physics> owns
// the Rapier world and each <RigidBody> writes the solved transform onto its
// TresGroup, while @vue-termui/three draws the scene — see <TresTerminal>,
// which is also what steps the simulation: <Physics> rides Tres's useLoop and
// that loop is driven by the terminal's frame callback.
//
// Same hand-rolled orbit controls as tres.vue (cientos' <OrbitControls> rides
// DOM pointer events that never fire in a TTY). Two departures from the docs
// scene: the floor is a thin slab rather than a plane, because the automatic
// collider derives from the mesh's bounding box and a plane's is zero-thick
// (crates dropped from 10 units up tunnel straight through it), and the bodies
// are positioned on the <RigidBody> instead of the mesh so each body spins
// around its own center.
//
// ../../rapier-init runs Rapier's solver once before the terminal renderer
// boots, which it has to (see that module) — importing it here is what makes
// this page work at all.
import '../../rapier-init'
import { Physics, RigidBody, type ExposedRigidBody } from '@tresjs/rapier'
import { onFrame, RGBA, type ThreeRenderable } from '@vue-termui/three'
import { Spherical, Vector3, type PerspectiveCamera } from 'three'
import {
  Box,
  computed,
  type MouseEvent,
  onKeyDown,
  ref,
  shallowRef,
  Text,
  useTerminalSize,
} from 'vue-termui'
import TresTerminal from '../../components/TresTerminal.vue'

const { height: rows } = useTerminalSize()
const sceneHeight = computed(() => Math.max(8, rows.value - 10))

const tres = shallowRef<{ renderable: ThreeRenderable | null } | null>(null)

const backgroundColor = RGBA.fromHex('#0C1116')

const debug = ref(false)
const paused = ref(false)

// Crates spawn from a fixed table so every reset replays the same tumble.
const CRATES = [
  { position: [-1.6, 5, -0.8], rotation: [0.3, 0.2, 0.1] },
  { position: [1.4, 6.5, 0.9], rotation: [-0.2, 0.5, 0.4] },
  { position: [0.2, 8, -1.7], rotation: [0.6, 0.1, -0.3] },
  { position: [-0.9, 9.5, 1.5], rotation: [-0.4, 0.7, 0.2] },
  { position: [1.9, 11, -0.4], rotation: [0.15, -0.3, 0.55] },
] as const

// Remounting every body is the whole reset: <RigidBody> drops its Rapier body
// on unmount and recreates it from the group transform on mount.
const generation = ref(0)

const ball = shallowRef<ExposedRigidBody | null>(null)

// second argument wakes the body up — a rigid-body that fell asleep ignores
// forces otherwise
function launchBall() {
  ball.value?.instance?.applyImpulse({ x: 0, y: 9, z: 0 }, true)
}

// plain shallowRef bound via the string ref: useTemplateRef wraps the value in
// a dev-only readonly proxy, which blocks mutating the camera on drag
const camera = shallowRef<PerspectiveCamera | null>(null)

// orbit offset from the target, not a world position (applyOrbit adds the two)
const INITIAL_POSITION = new Vector3(11, 11, 11)
// rad per terminal cell; rows count double since cells are ~2x taller than wide
const ROTATE_SPEED = 0.04
const ZOOM_STEP = 1.1
const MIN_RADIUS = 6
const MAX_RADIUS = 80
const MIN_POLAR = 0.1
const MAX_POLAR = Math.PI - 0.1

const orbitTarget = new Vector3(0, 2, 0)
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
  if (key.name === 'space') {
    launchBall()
  } else if (key.name === 'r') {
    generation.value++
  } else if (key.name === 'd') {
    debug.value = !debug.value
  } else if (key.name === 'p') {
    paused.value = !paused.value
  } else if (key.name === 'u') {
    tres.value?.renderable?.renderer.cycleMode()
  }
})

// The ball's height in the title is the cheapest proof the solver is running;
// sampled a few times a second so the terminal isn't re-rendered per frame.
const ballHeight = ref(0)
const SAMPLE_INTERVAL = 250
let sinceSample = 0
onFrame((deltaMs) => {
  sinceSample += deltaMs
  if (sinceSample < SAMPLE_INTERVAL) return
  sinceSample = 0
  ballHeight.value = ball.value?.instance?.translation().y ?? 0
})
</script>

<template>
  <Box flexDirection="column">
    <Text>TresJS + Rapier — declarative physics (rapier.tresjs.org) rendered in the terminal</Text>
    <Text dim
      >Drag: orbit · Right drag: pan · Scroll: zoom · Space: launch ball · R: reset · D: debug ({{
        debug ? 'on' : 'off'
      }}) · P: {{ paused ? 'resume' : 'pause' }}</Text
    >
    <Box
      :border="true"
      :title="`physics · ball y ${ballHeight.toFixed(1)}`"
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
          :position="[11, 13, 11]"
          :fov="45"
          :near="0.1"
          :far="1000"
          :look-at="[0, 2, 0]"
        />
        <TresAmbientLight :intensity="0.6" />
        <TresDirectionalLight :position="[6, 12, 4]" :intensity="1.6" cast-shadow />
        <!-- <Physics> loads Rapier's wasm in an async setup, so it has to be
        wrapped in a Suspense boundary -->
        <Suspense>
          <Physics :debug="debug" :pause="paused">
            <RigidBody type="fixed" :position="[0, -0.25, 0]">
              <TresMesh receive-shadow>
                <TresBoxGeometry :args="[12, 0.5, 12]" />
                <TresMeshPhongMaterial color="#3E5C76" :shininess="10" specular="#222222" />
              </TresMesh>
            </RigidBody>
            <RigidBody
              ref="ball"
              :key="`ball-${generation}`"
              collider="ball"
              :position="[0, 4, 0]"
              :restitution="0.8"
            >
              <TresMesh cast-shadow>
                <TresSphereGeometry :args="[1, 24, 16]" />
                <TresMeshNormalMaterial />
              </TresMesh>
            </RigidBody>
            <RigidBody
              v-for="(crate, index) in CRATES"
              :key="`crate-${generation}-${index}`"
              :position="crate.position"
              :rotation="crate.rotation"
              :restitution="0.2"
              :friction="0.9"
            >
              <TresMesh cast-shadow receive-shadow>
                <TresBoxGeometry :args="[1.4, 1.4, 1.4]" />
                <TresMeshNormalMaterial />
              </TresMesh>
            </RigidBody>
          </Physics>
        </Suspense>
      </TresTerminal>
    </Box>
  </Box>
</template>
