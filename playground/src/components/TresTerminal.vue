<script setup lang="ts">
// TresJS in the terminal: <TresCanvasContext> runs Tres's custom Vue renderer
// to build a three.js scene graph from the slot, and <Three> (the terminal
// WebGPU renderable) does the actual drawing. Tres normally targets a browser
// <canvas>, but it only touches it for sizing (parentElement.offset*),
// pointer-event listeners and pointer capture — a stub object covers that in a
// TTY. The renderer factory prop replaces its WebGLRenderer with a no-op shell
// whose only job is to drive Tres's ready/dispose lifecycle.
//
// Caveats: Tres's own render loop rides requestAnimationFrame off `window`,
// which doesn't exist here, so it never ticks by itself — the terminal's frame
// callback drives its hooks instead (see below), which is what makes useLoop
// (and anything built on it, like @tresjs/rapier's <Physics>) work. Pointer
// events never fire.
import { TresCanvasContext, type TresContext, type TresRenderer } from '@tresjs/core'
import { onFrame, Three, type ThreeProps, type ThreeRenderable } from '@vue-termui/three'
import type { Mesh, OrthographicCamera, PerspectiveCamera } from 'three'
import {
  computed,
  getCurrentScope,
  onBeforeUnmount,
  onMounted,
  onScopeDispose,
  shallowRef,
  toRaw,
  type PropType,
} from 'vue-termui'

defineOptions({ inheritAttrs: false })

const props = defineProps({
  rendererOptions: Object as PropType<ThreeProps['rendererOptions']>,
})

const emit = defineEmits<{ ready: [context: TresContext] }>()

const noop = () => {}
const stub = {
  // domElement dims: Tres fires `ready` (and mounts the slot) once these are
  // nonzero after the renderer initializes.
  width: 1,
  height: 1,
  // measured by useElementSize via parentElement (self-referenced below).
  // Width 0 makes Tres's aspectRatio falsy so its camera manager never writes
  // camera.aspect — the terminal cell grid is the truth and ThreeRenderable's
  // autoAspect owns it. Height nonzero avoids the "canvas has no area" warning.
  offsetWidth: 0,
  offsetHeight: 500,
  parentElement: null as unknown,
  addEventListener: noop,
  removeEventListener: noop,
  getBoundingClientRect: () => ({ width: 800, height: 500, top: 0, left: 0 }),
  setPointerCapture: noop,
  hasPointerCapture: () => false,
  releasePointerCapture: noop,
}
stub.parentElement = stub
const canvas = stub as unknown as HTMLCanvasElement

function createStubRenderer(): TresRenderer {
  return {
    domElement: canvas,
    render: noop,
    setSize: noop,
    dispose: noop,
    // written unconditionally: Tres's Boolean `shadows` prop coerces to false
    shadowMap: { enabled: false },
  } as unknown as TresRenderer
}

const context = shallowRef<TresContext | null>(null)
const scene = computed(() => context.value?.scene.value ?? null)
// toRaw: Tres keeps cameras in a deep ref, so activeCamera.value is a reactive
// proxy. Handing that proxy to <Three> makes autoAspect's per-frame
// `camera.aspect` write re-trigger Tres's camera watcher (it tracks the fields
// through updateProjectionMatrix), which writes its own aspect back — a
// per-frame ping-pong the terminal loses. The raw camera bypasses tracking.
const camera = computed(() =>
  toRaw(
    context.value?.camera.activeCamera.value as PerspectiveCamera | OrthographicCamera | undefined,
  ),
)

function onReady(ctx: TresContext) {
  context.value = ctx
  emit('ready', ctx)
}

// plain shallowRef + string ref (not useTemplateRef: its dev readonly proxy
// would block the renderable's internal mutations)
const three = shallowRef<{ renderable: ThreeRenderable | null } | null>(null)

// Tres's camera manager writes an aspect derived from the stub sizes, but
// ThreeRenderable's autoAspect re-syncs the terminal aspect every frame, so
// no counter-measure is needed here.
const renderable = computed(() => three.value?.renderable ?? null)
defineExpose({ renderable })

// Teardown order: the terminal destroys <Three>'s renderable — and with it
// three's WebGPU renderer and its node cache — before Tres tears the scene graph
// down, and a material disposed after that throws inside three ("Cannot read
// properties of undefined (reading 'usedTimes')"). Tres swallows that while
// unmounting its own nodes, but not in the canvas teardown that sweeps whatever
// is left in the scene — e.g. everything under a <Suspense> boundary, which it
// never unmounts, so leaving a page with one logs the error. Free the GPU
// resources here instead, while the renderer is still alive; Tres's own pass
// then finds nothing left to release.
onBeforeUnmount(() => {
  context.value?.scene.value.traverse((object) => {
    const { geometry, material } = object as Partial<Mesh>
    geometry?.dispose()
    for (const entry of Array.isArray(material) ? material : [material]) entry?.dispose()
  })
})

// Tres's loop rides @vueuse's useRafFn, which needs `window` to resume, so in a
// TTY it stays paused and every useLoop() callback would be dead code. The loop
// only hands out registrars (`on`), never its `trigger`, so replace them with
// ones that mirror each callback into a set onFrame can walk.
type LoopContext = { delta: number; elapsed: number }
type LoopCallback = (context: LoopContext) => void

const beforeLoopCallbacks = new Set<LoopCallback>()
const loopCallbacks = new Set<LoopCallback>()

function registerInto(callbacks: Set<LoopCallback>) {
  return (callback: LoopCallback) => {
    callbacks.add(callback)
    const off = () => callbacks.delete(callback)
    // same contract as @vueuse's createEventHook: a callback registered from a
    // component goes away with it
    if (getCurrentScope()) onScopeDispose(off)
    return { off }
  }
}

const canvasContext = shallowRef<{ context: TresContext } | null>(null)

// onMounted, not @ready: Tres mounts the slot from its ready handler (a tick
// later), so this lands before any child — even one registering during setup —
// can reach the untouched hooks.
onMounted(() => {
  const loop = canvasContext.value?.context.renderer.loop
  if (!loop) return
  loop.onBeforeLoop = registerInto(beforeLoopCallbacks)
  loop.onLoop = registerInto(loopCallbacks)
})

let elapsed = 0
onFrame((deltaMs) => {
  const delta = deltaMs / 1000
  elapsed += delta
  const loopContext = { delta, elapsed }
  // iterate over copies: a callback may register or unregister another one
  for (const callback of [...beforeLoopCallbacks]) callback(loopContext)
  // <Three> draws once this returns, so onRender callbacks run right *before*
  // the frame they belong to instead of right after it
  for (const callback of [...loopCallbacks]) callback(loopContext)
})
</script>

<template>
  <Three
    ref="three"
    :scene="scene"
    :camera="camera"
    :rendererOptions="props.rendererOptions"
    v-bind="$attrs"
  />
  <TresCanvasContext
    ref="canvasContext"
    :canvas="canvas"
    :renderer="createStubRenderer"
    @ready="onReady"
  >
    <slot />
  </TresCanvasContext>
</template>
