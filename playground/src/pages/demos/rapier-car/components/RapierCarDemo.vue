<script setup lang="ts">
// The TresJS lab's rapier-car demo (a Rocket-League-ish arcade car on Rapier's
// raycast vehicle controller) rendered in the terminal. The physics, the car
// tune, the air game and the chase camera are ports of the originals; what's
// gone is everything that only exists in a browser — the tweakpane controls and
// HTML overlays, the bloom pass, the GLSL grass with its canvas trample map and
// the exhaust particle VFX (a raw-GLSL ShaderMaterial, which three's WebGPU
// renderer would need as a node material).
//
// Keyboard, not mouse: the original binds boost/jump/rear-view to mouse buttons,
// which a TTY reports without press-and-hold semantics. Held keys instead come
// from the Kitty keyboard protocol (see ./held-keys). The pad bindings are the
// original's, read through SDL rather than the Gamepad API (see ./gamepad).
//
// The whole page lives here, not in a route file, because two routes render it:
// one with the demo's GLTF models and one with the primitive stand-ins (see
// ./models). `modelStyle` is provided to the scene rather than passed down,
// since three components deep in the tree each pick their own model up.
//
// ../../../../rapier-init runs Rapier's solver once before the terminal renderer
// boots, which it has to (see that module) — importing it here is what makes
// this page work at all.
import '../../../../rapier-init'
import { Physics } from '@tresjs/rapier'
import {
  onFrame,
  RGBA,
  type AsciiModeOptions,
  type AsciiStyle,
  type RenderModeName,
  type ThreeRenderable,
} from '@vue-termui/three'
import { MathUtils } from 'three'
import {
  Box,
  computed,
  ref,
  shallowRef,
  Text,
  useTerminalSize,
  watch,
  watchEffect,
} from 'vue-termui'
import { asciiRamps } from '../../../../ascii-ramps'
import TresTerminal from '../../../../components/TresTerminal.vue'
import CameraRig from './CameraRig.vue'
import CarComponent from './CarComponent.vue'
import { useCarGamepad } from './gamepad'
import { useHeldKeys } from './held-keys'
import type { ModelStyle } from './models'
import SceneLighting from './SceneLighting.vue'
import SceneWorld from './SceneWorld.vue'

const props = defineProps<{ modelStyle: ModelStyle }>()

// Sim runs 2x real time: the car tune (incl. effective gravity) expects it
const SIM_SPEED = 2

// Pad tuning the lab exposed through tweakpane
const PAD_STEER_SENSITIVITY = 1.25
const PAD_STEER_EXPO = 0.3
const PAD_DEADZONE = 0.15

const pad = useCarGamepad({
  steerSensitivity: PAD_STEER_SENSITIVITY,
  steerExpo: PAD_STEER_EXPO,
  stickDeadzone: PAD_DEADZONE,
})

const { height: rows } = useTerminalSize()
// the two pad lines in the template only exist while one is connected
const sceneHeight = computed(() => Math.max(8, rows.value - (pad.connected ? 13 : 11)))

const tres = shallowRef<{ renderable: ThreeRenderable | null } | null>(null)
const carRef = shallowRef<InstanceType<typeof CarComponent> | null>(null)
const worldRef = shallowRef<InstanceType<typeof SceneWorld> | null>(null)
const rigRef = shallowRef<InstanceType<typeof CameraRig> | null>(null)

const backgroundColor = RGBA.fromHex('#06091a')

const paused = ref(false)
const debug = ref(false)
// RL default: ball cam on
const ballCam = ref(true)

const mode = ref<RenderModeName>('gpu')
const style = ref<AsciiStyle>('shape')
const contrast = ref(2)
// full charset: the shape style picks glyphs by ink position, so the more shapes
// to choose from the better
const rampIndex = ref(asciiRamps.findIndex((ramp) => ramp.name === 'full'))

// Everything goes through the held-key tracker, including the one-shot toggles:
// a key that repeats under the Kitty protocol would otherwise fire them on every
// repeat, while a rising edge is one press
const WATCHED_KEYS = [
  // driving
  'w',
  's',
  'a',
  'd',
  'up',
  'down',
  'left',
  'right',
  'space',
  'x',
  'z',
  'c',
  'q',
  'e',
  'r',
  // views
  't',
  'v',
  // sim + render mode
  'p',
  'b',
  'm',
  'n',
  'l',
  'k',
] as const
const held = useHeldKeys(WATCHED_KEYS)

/** Runs `press` on each rising edge of `name`, never on auto-repeat. */
function onPress(name: string, press: () => void) {
  watch(
    () => held.has(name),
    (down) => {
      if (down) press()
    },
  )
}

const rearView = computed(() => held.has('t') || pad.rearViewHeld)

// Axes derived from the full pressed-key state: releasing one key of an opposing
// pair no longer zeroes the axis while the other is still held
const forwardAxis = computed(
  () => Number(held.has('s') || held.has('down')) - Number(held.has('w') || held.has('up')),
)
const steerAxis = computed(
  () => Number(held.has('a') || held.has('left')) - Number(held.has('d') || held.has('right')),
)

watchEffect(() => {
  const movement = carRef.value?.movement
  if (!movement) return

  // RL pad semantics: triggers drive on the ground, stick Y pitches in the air
  const padForward = carRef.value?.grounded === false ? pad.pitch : pad.forward
  movement.forward = MathUtils.clamp(forwardAxis.value + padForward, -1, 1)
  movement.right = MathUtils.clamp(steerAxis.value + pad.right, -1, 1)
  movement.roll = Number(held.has('e')) - Number(held.has('q'))
  movement.boost = held.has('x') || pad.boost ? 1 : 0
  movement.brake = held.has('c') ? 1 : 0
  movement.jumpHeld = held.has('space') || pad.jumpHeld
  movement.slide = held.has('z') || pad.slide
  movement.reset = held.has('r') || pad.resetHeld
})

function requestJump() {
  const movement = carRef.value?.movement
  if (movement) movement.jump = true
}

function resetScene() {
  worldRef.value?.reset?.()
  // Respawning far away snaps the camera via teleport detection; resetting near
  // the spawn doesn't, so force the pan back behind the car
  rigRef.value?.resync?.()
}

onPress('space', requestJump)
onPress('r', resetScene)

/** Rising edge of a pad button, the `whenever()` the original used. */
function onPadPress(read: () => boolean, press: () => void) {
  watch(read, (down) => {
    if (down) press()
  })
}

onPadPress(() => pad.jumpHeld, requestJump)
onPadPress(() => pad.resetHeld, resetScene)
onPadPress(
  () => pad.ballCamPressed,
  () => {
    ballCam.value = !ballCam.value
  },
)

// options merge over the ones already in use, so each key sends only its own
// field; naming the ascii mode also selects it when another one is active
function setAsciiOptions(options: AsciiModeOptions) {
  const renderer = tres.value?.renderable?.renderer
  if (!renderer) return
  renderer.setMode({ name: 'ascii', options })
  mode.value = renderer.getMode().name
}

onPress('v', () => {
  ballCam.value = !ballCam.value
})
onPress('p', () => {
  paused.value = !paused.value
})
onPress('b', () => {
  debug.value = !debug.value
})
onPress('m', () => {
  const renderer = tres.value?.renderable?.renderer
  if (!renderer) return
  renderer.cycleMode()
  mode.value = renderer.getMode().name
})
onPress('n', () => {
  style.value = style.value === 'shape' ? 'ramp' : 'shape'
  setAsciiOptions({ style: style.value })
})
onPress('l', () => {
  rampIndex.value = (rampIndex.value + 1) % asciiRamps.length
  setAsciiOptions({ chars: asciiRamps[rampIndex.value]!.chars })
})
onPress('k', () => {
  contrast.value = (contrast.value % 4) + 1
  setAsciiOptions({ contrast: contrast.value })
})

// Sampled a few times a second so the terminal isn't re-rendered per frame
const SAMPLE_INTERVAL = 250
const fps = ref(0)
const speed = ref(0)
const airborne = ref(false)
// Pad analog readout, the live half of the original's bottom-left indicator
const padAxes = ref('')
let sinceSample = 0
let frames = 0
onFrame((deltaMs) => {
  frames++
  sinceSample += deltaMs
  if (sinceSample < SAMPLE_INTERVAL) return
  fps.value = Math.round((frames * 1000) / sinceSample)
  speed.value = Math.abs(carRef.value?.speed?.() ?? 0)
  airborne.value = carRef.value?.grounded === false
  padAxes.value = pad.connected
    ? `RT ${pad.throttle.toFixed(2)} · LT ${pad.brake.toFixed(2)} · stick ${pad.stickX.toFixed(
        2,
      )}, ${pad.stickY.toFixed(2)}`
    : ''
  sinceSample = 0
  frames = 0
})
</script>

<template>
  <Box flexDirection="column">
    <Text
      >TresJS + Rapier — the lab's arcade car demo, driven in the terminal ({{
        props.modelStyle === 'simple' ? 'primitive models' : 'GLTF models'
      }})</Text
    >
    <Text dim
      >W/S throttle · A/D steer · X boost · Space jump/dodge · Z slide · Q/E air roll · C brake · R
      reset</Text
    >
    <Text dim
      >V ball cam ({{ ballCam ? 'on' : 'off' }}) · T rear view (hold) · P
      {{ paused ? 'resume' : 'pause' }} · B debug ({{ debug ? 'on' : 'off' }})</Text
    >
    <Text dim
      >M mode ({{ mode }}) · N style ({{ style }}) · L chars ({{ asciiRamps[rampIndex]!.name }}) · K
      contrast ({{ contrast }})</Text
    >
    <!-- Pad bindings and live state, the original's two indicator cards. Kept to
    about the width of the key hints above so neither line wraps — a wrapped line
    also costs the scene a row that sceneHeight does not account for. -->
    <Text v-if="pad.connected" dim
      >Pad: RT/LT drive · stick steer · A jump · B/RB boost · LB slide · Y ball cam · X rear · Sel
      reset</Text
    >
    <Text v-if="pad.connected" dim
      >🎮 {{ pad.id }} · {{ padAxes }} · pressed: {{ pad.pressedButtons.join(', ') || '—' }}</Text
    >
    <Box
      :border="true"
      :title="`rapier car · ${fps} fps · ${speed.toFixed(1)} u/s · ${airborne ? 'air' : 'ground'}`"
      width="100%"
      :height="sceneHeight"
    >
      <TresTerminal ref="tres" :rendererOptions="{ backgroundColor, shadows: true }">
        <SceneLighting />
        <!-- <Physics> loads Rapier's wasm in an async setup, so it has to be
        wrapped in a Suspense boundary -->
        <Suspense>
          <Physics :time-scale="SIM_SPEED" :gravity="[0, -9.81, 0]" :debug="debug" :pause="paused">
            <SceneWorld ref="worldRef" :model-style="props.modelStyle" />
            <CarComponent ref="carRef" :model-style="props.modelStyle" />
            <CameraRig
              ref="rigRef"
              :car="carRef"
              :world="worldRef"
              :ball-cam="ballCam"
              :rear-view="rearView"
            />
          </Physics>
        </Suspense>
      </TresTerminal>
    </Box>
  </Box>
</template>
