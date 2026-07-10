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
// which doesn't exist here — useLoop callbacks never fire; animate with
// onFrame from @vue-termui/three instead. Pointer events never fire either.
import { TresCanvasContext, type TresContext, type TresRenderer } from '@tresjs/core'
import { Three, type ThreeProps, type ThreeRenderable } from '@vue-termui/three'
import type { OrthographicCamera, PerspectiveCamera } from 'three'
import { computed, shallowRef, type PropType } from 'vue-termui'

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
  // measured by useElementSize via parentElement (self-referenced below);
  // nonzero avoids the "canvas has no area" warning. The real aspect ratio is
  // re-applied from the terminal cell grid by ThreeRenderable's autoAspect.
  offsetWidth: 800,
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
const camera = computed(
  () =>
    context.value?.camera.activeCamera.value as PerspectiveCamera | OrthographicCamera | undefined,
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
</script>

<template>
  <Three
    ref="three"
    :scene="scene"
    :camera="camera"
    :rendererOptions="props.rendererOptions"
    v-bind="$attrs"
  />
  <TresCanvasContext :canvas="canvas" :renderer="createStubRenderer" @ready="onReady">
    <slot />
  </TresCanvasContext>
</template>
