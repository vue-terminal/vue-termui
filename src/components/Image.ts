import {
  type ImageFit,
  type ImageRenderable,
  type ImageRenderableOptions,
  type ImageRenderProtocol,
  type ImageSource,
  NativeImage,
} from '@opentui/core'
import { defineComponent, h, onMounted, shallowRef, type VNode } from '@vue/runtime-core'
import {
  type ExtractEventsNames,
  optionalBooleanProps,
  type RenderableEventProps,
  renderableEmits,
  renderableProps,
  setupRenderableEvents,
  type TuiComponent,
} from './utils'

// Re-exported so apps can build sources (`NativeImage.load`, `.decode`,
// `.fromRgba`, `.resize`, …), type a `@load` handler and narrow a load failure
// without reaching into `@opentui/core` directly.
export { ImageLoadError, NativeImage } from '@opentui/core'
export type { ImageFit, ImageSource } from '@opentui/core'

/**
 * Terminal protocol used to draw an image. `'auto'` picks the best one the
 * terminal supports (Kitty, then Sixel, then Unicode blocks).
 */
export type ImageProtocol = ImageRenderProtocol

/**
 * Props accepted by {@link Image}. Extends OpenTUI's native `ImageRenderable`
 * options (`width`/`height`, `flexGrow`, `position`, `opacity`, …), which fall
 * through to the underlying renderable.
 */
export interface ImageProps
  extends
    Omit<ImageRenderableOptions, 'source' | 'fit' | 'protocol' | 'onLoad' | 'onError'>,
    RenderableEventProps {
  /**
   * What to display: a file path, a `file:`/`http(s):`/`data:`/`blob:` URL (as a
   * string or `URL`), encoded bytes (`Uint8Array`/`ArrayBuffer`/`Blob`/
   * `Response`), or an already decoded {@link NativeImage}. PNG, JPEG, WebP and
   * GIF are detected from the bytes, not from the file extension.
   *
   * Changing it loads the new image in the background, keeping the current one
   * on screen until it succeeds; unsetting it blanks the component.
   */
  source?: ImageSource | NativeImage

  /**
   * How the image is scaled into the component's box.
   *
   * @default 'fit'
   */
  fit?: ImageFit

  /**
   * Protocol used to draw the image. Overlapping images must resolve to the
   * same one, so either leave them all on `'auto'` or pin them to the same
   * value.
   *
   * @default 'auto'
   */
  protocol?: ImageProtocol

  /**
   * Emitted once the current source has been decoded, with the image OpenTUI
   * now owns — do not dispose it.
   */
  onLoad?: (image: NativeImage) => void

  /**
   * Emitted when the current source fails to load. The previously loaded image,
   * if any, stays on screen.
   */
  onError?: (error: unknown) => void
}

/**
 * The terminal element behind {@link Image}, as exposed by template refs and
 * `$el`.
 */
export type ImageElement = ImageRenderable

/**
 * Displays an image, mapping to OpenTUI's `ImageRenderable`. It is drawn with
 * the terminal's own graphics protocol when there is one (Kitty, Sixel) and
 * with Unicode half-blocks everywhere else, so it works in any terminal.
 *
 * Give it a size: like any renderable it has no intrinsic one, so an `Image`
 * with neither `width`/`height` nor a flex rule to stretch it paints nothing.
 * `fit` then decides how the picture fills that box.
 *
 * Loading is asynchronous — listen to `@load`/`@error`, or await the
 * renderable's `loadPromise` through `$el`, which also carries `image`,
 * `loading`, `effectiveProtocol` and `getFittedSize()`.
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * import { Image } from 'vue-termui'
 * const cover = new URL('./cover.webp', import.meta.url)
 * </script>
 * <template>
 *   <Image :source="cover" :width="40" :height="15" fit="cover" @error="console.error" />
 * </template>
 * ```
 */
export const Image: TuiComponent<ImageProps, ImageElement> = defineComponent({
  name: 'Image',
  inheritAttrs: false,
  props: {
    ...renderableProps,
  },
  emits: {
    ...renderableEmits,
  } satisfies ExtractEventsNames<ImageProps, ImageRenderableOptions>,
  setup(props, { emit, attrs }) {
    const image = shallowRef<ImageRenderable | null>(null)

    onMounted(() => {
      const el = image.value
      if (!el) return

      // Common Renderable events + autofocus on mount. `load`/`error` need no
      // wiring: they are native options (`onLoad`/`onError`), so they fall
      // through with the other attrs.
      setupRenderableEvents(el, emit, props)
    })

    return (): VNode =>
      h('tui-image', {
        // native options and listeners, including `source`, `fit`, `protocol`
        // and the `onLoad`/`onError` callbacks. Forwarding `undefined` is safe
        // for these three: their setters map it back to the default (`'fit'`,
        // `'auto'`) or, for `source`, deliberately blank the image.
        ...attrs,
        // Coerce and forward each optional boolean only when set, so an unset
        // prop keeps the renderable's own default (see `optionalBooleanProps`).
        ...optionalBooleanProps(props, ['focusable']),
        ref: image,
      })
  },
})
