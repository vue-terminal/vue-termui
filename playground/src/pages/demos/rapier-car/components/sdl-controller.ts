// A TTY has no `navigator.getGamepads()`, so the pad comes from SDL's game
// controller layer (@kmamal/sdl). That layer is the same idea as the browser's
// standard mapping: SDL's controller database normalizes any known pad to the
// Xbox-shaped `a/b/x/y/leftShoulder/...` buttons and `leftStickX/leftTrigger/...`
// axes that the W3C standard mapping also describes, so ./gamepad reads named
// fields instead of the spec's magic indices.
//
// SDL is loaded on first use rather than at import time: page modules are all
// imported when the playground boots (routes are bundled synchronously), and
// `SDL_Init` has no business running for someone browsing the text demos. A
// missing or unbuildable native module just means "no pad".
import { onScopeDispose, shallowRef, type ShallowRef } from 'vue-termui'

type SdlModule = typeof import('@kmamal/sdl')

/** An open game controller, as `sdl.controller.openDevice()` returns it. */
export type Controller = ReturnType<SdlModule['controller']['openDevice']>

let sdlPromise: Promise<SdlModule | null> | undefined

function loadSdl(): Promise<SdlModule | null> {
  // The package is CJS, so the interop shape depends on who loaded it: a
  // namespace with the module under `default`, or the module itself
  sdlPromise ??= import('@kmamal/sdl')
    .then((mod) => (mod as { default?: SdlModule }).default ?? mod)
    .catch(() => null)
  return sdlPromise
}

/**
 * First connected game controller, reopened as pads come and go. Null until SDL
 * has loaded, when nothing is plugged in, or when SDL isn't available at all.
 */
export function useSdlController(): ShallowRef<Controller | null> {
  const controller = shallowRef<Controller | null>(null)
  let disposed = false

  void loadSdl().then((sdl) => {
    if (!sdl || disposed) return

    const open = () => {
      if (controller.value && !controller.value.closed) return
      const device = sdl.controller.devices[0]
      // A pad SDL has no mapping for opens as a joystick only; skip it rather
      // than guess which raw button is "A"
      controller.value = device ? sdl.controller.openDevice(device) : null
    }

    open()
    sdl.controller.on('deviceAdd', open)
    sdl.controller.on('deviceRemove', () => {
      if (controller.value?.closed) controller.value = null
      open()
    })
  })

  onScopeDispose(() => {
    disposed = true
    if (controller.value && !controller.value.closed) controller.value.close()
    controller.value = null
  })

  return controller
}
