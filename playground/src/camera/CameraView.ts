import type { BoxRenderable } from '@opentui/core'
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
import { CameraRenderable } from './CameraRenderable'

/**
 * Props accepted by {@link CameraView}. Box layout options (`width`, `height`,
 * `flexGrow`, …) fall through to the wrapping `tui-box`, which the video
 * fills entirely (letterboxed to the source aspect ratio).
 */
export interface CameraViewProps {
  /** Camera index on macOS, `/dev/videoN` index or path on Linux. */
  device?: string | number
  /** Capture framerate. Read once when the renderable mounts. */
  fps?: number
}

/**
 * Renders the system camera video stream inside the terminal, modeled on the
 * `Three` component: wraps a `tui-box` and fills it with a
 * {@link CameraRenderable}. Emits `error` with ffmpeg's message when capture
 * fails (missing ffmpeg, unknown device, no permission, …).
 */
export const CameraView: DefineComponent<CameraViewProps> = defineComponent({
  name: 'CameraView',
  inheritAttrs: false,
  props: {
    device: { type: [Number, String] as PropType<string | number>, default: 0 },
    fps: { type: Number, default: 30 },
  },
  emits: {
    error: (message: string) => typeof message === 'string',
  },
  setup(props, { attrs, expose, emit }) {
    const box = shallowRef<BoxRenderable | null>(null)
    const renderable = shallowRef<CameraRenderable | null>(null)
    const renderer = useRenderer()

    onMounted(() => {
      const parent = box.value
      if (!parent) return
      const camera = new CameraRenderable(renderer, {
        width: '100%',
        height: '100%',
        device: props.device,
        fps: props.fps,
        onError: (message) => emit('error', message),
      })
      renderable.value = camera
      parent.add(camera)
    })

    onUnmounted(() => {
      renderable.value?.destroy()
      renderable.value = null
    })

    watch(
      () => props.device,
      (device) => renderable.value?.setDevice(device ?? 0),
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
}) as DefineComponent<CameraViewProps>
