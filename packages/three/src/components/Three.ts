import type { BoxRenderable } from '@opentui/core'
import type { OrthographicCamera, PerspectiveCamera, Scene } from 'three'
import {
  defineComponent,
  h,
  onMounted,
  onUnmounted,
  shallowRef,
  useRenderer,
  watch,
  type DefineComponent,
  type PropType,
  type VNode,
} from 'vue-termui'
import { ThreeRenderable, type ThreeRenderableOptions } from '../ThreeRenderable'

/**
 * Props accepted by {@link Three}. Box layout options (`width`, `height`,
 * `flexGrow`, …) fall through to the wrapping `tui-box`, which the scene
 * fills entirely.
 */
export interface ThreeProps {
  /**
   * The three.js scene to render. Swapping it re-renders with the new scene.
   */
  scene?: Scene | null

  /**
   * Camera used to render {@link ThreeProps.scene}. Defaults to a perspective
   * camera at `(0, 0, 3)` looking at the origin.
   */
  camera?: PerspectiveCamera | OrthographicCamera

  /**
   * Options for the underlying {@link ThreeCliRenderer} (`backgroundColor`,
   * `superSample`, `focalLength`, …). Read once when the renderable mounts.
   */
  rendererOptions?: ThreeRenderableOptions['renderer']

  /**
   * Keep the camera aspect ratio in sync with the rendered area.
   * @default true
   */
  autoAspect?: boolean
}

/**
 * Renders a three.js WebGPU scene inside the terminal. The component wraps a
 * `tui-box` (all box layout props apply) and fills it with a
 * {@link ThreeRenderable} that re-renders the scene every frame.
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * import { Three } from '@vue-termui/three'
 * import { Scene, PerspectiveCamera } from 'three'
 * const scene = new Scene()
 * const camera = new PerspectiveCamera(45, 1, 0.1, 100)
 * </script>
 * <template>
 *   <Three :scene="scene" :camera="camera" />
 * </template>
 * ```
 */
export const Three: DefineComponent<ThreeProps> = defineComponent({
  name: 'Three',
  inheritAttrs: false,
  props: {
    scene: Object as PropType<Scene | null>,
    camera: Object as PropType<PerspectiveCamera | OrthographicCamera>,
    rendererOptions: Object as PropType<ThreeRenderableOptions['renderer']>,
    autoAspect: { type: Boolean, default: true },
  },
  setup(props, { attrs, expose }) {
    const box = shallowRef<BoxRenderable | null>(null)
    const renderable = shallowRef<ThreeRenderable | null>(null)
    const renderer = useRenderer()

    onMounted(() => {
      const parent = box.value
      if (!parent) return
      const three = new ThreeRenderable(renderer, {
        width: '100%',
        height: '100%',
        scene: props.scene ?? null,
        camera: props.camera,
        autoAspect: props.autoAspect,
        renderer: props.rendererOptions,
      })
      renderable.value = three
      parent.add(three)
    })

    onUnmounted(() => {
      renderable.value?.destroy()
      renderable.value = null
    })

    watch(
      () => props.scene,
      (scene) => renderable.value?.setScene(scene ?? null),
    )
    watch(
      () => props.camera,
      (camera) => {
        if (camera) renderable.value?.setActiveCamera(camera)
      },
    )

    expose({ renderable })

    return (): VNode =>
      h('tui-box', {
        width: '100%',
        height: '100%',
        ...attrs,
        ref: box,
      })
  },
}) as DefineComponent<ThreeProps>
