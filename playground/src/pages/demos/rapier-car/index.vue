<script setup lang="ts">
// The TresJS lab's rapier-car demo (a Rocket-League-ish arcade car on Rapier's
// raycast vehicle controller) rendered in the terminal. The physics, the car
// tune, the air game and the chase camera are ports of the originals; what's
// gone is everything that only exists in a browser — the tweakpane controls and
// HTML overlays, the bloom pass, the GLSL grass with its canvas trample map, the
// exhaust particle VFX (a raw-GLSL ShaderMaterial, which three's WebGPU renderer
// would need as a node material), the GLTF models (see components/car-model) and
// gamepad support.
//
// Keyboard, not mouse: the original binds boost/jump/rear-view to mouse buttons,
// which a TTY reports without press-and-hold semantics. Held keys instead come
// from the Kitty keyboard protocol (see components/held-keys).
//
// ../../../rapier-init runs Rapier's solver once before the terminal renderer
// boots, which it has to (see that module) — importing it here is what makes
// this page work at all.
import '../../../rapier-init'
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
import { asciiRamps } from '../../../ascii-ramps'
import TresTerminal from '../../../components/TresTerminal.vue'
import CameraRig from './components/CameraRig.vue'
import CarComponent from './components/CarComponent.vue'
import { useHeldKeys } from './components/held-keys'
import SceneLighting from './components/SceneLighting.vue'
import SceneWorld from './components/SceneWorld.vue'

// Sim runs 2x real time: the car tune (incl. effective gravity) expects it
const SIM_SPEED = 2

const { height: rows } = useTerminalSize()
const sceneHeight = computed(() => Math.max(8, rows.value - 11))

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

const rearView = computed(() => held.has('t'))

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

  // On the ground the throttle axis drives; in the air it pitches, RL-style
  movement.forward = MathUtils.clamp(forwardAxis.value, -1, 1)
  movement.right = MathUtils.clamp(steerAxis.value, -1, 1)
  movement.roll = Number(held.has('e')) - Number(held.has('q'))
  movement.boost = held.has('x') ? 1 : 0
  movement.brake = held.has('c') ? 1 : 0
  movement.jumpHeld = held.has('space')
  movement.slide = held.has('z')
  movement.reset = held.has('r')
})

onPress('space', () => {
  const movement = carRef.value?.movement
  if (movement) movement.jump = true
})

onPress('r', () => {
  worldRef.value?.reset?.()
  // Respawning far away snaps the camera via teleport detection; resetting near
  // the spawn doesn't, so force the pan back behind the car
  rigRef.value?.resync?.()
})

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
let sinceSample = 0
let frames = 0
onFrame((deltaMs) => {
  frames++
  sinceSample += deltaMs
  if (sinceSample < SAMPLE_INTERVAL) return
  fps.value = Math.round((frames * 1000) / sinceSample)
  speed.value = Math.abs(carRef.value?.speed?.() ?? 0)
  airborne.value = carRef.value?.grounded === false
  sinceSample = 0
  frames = 0
})
</script>

<template>
  <Box flexDirection="column">
    <Text>TresJS + Rapier — the lab's arcade car demo, driven in the terminal</Text>
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
            <SceneWorld ref="worldRef" />
            <CarComponent ref="carRef" />
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
