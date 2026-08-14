// Port of the lab demo's gamepad.ts. Same bindings, same state shape and the
// same deadzone/expo shaping; the two browser bits are replaced:
// `navigator.getGamepads()` → SDL's controller layer (see ./sdl-controller) and
// VueUse's `useRafFn` → the terminal's frame callback.
import { onFrame } from '@vue-termui/three'
import { reactive, toValue, type MaybeRefOrGetter } from 'vue-termui'
import { useSdlController } from './sdl-controller'

const STICK_DEADZONE = 0.15
const TRIGGER_DEADZONE = 0.05

export interface CarGamepadOptions {
  /** Multiplier on stick steering (and air yaw), clamped to ±1 */
  steerSensitivity?: MaybeRefOrGetter<number>
  /** 0 = linear, 1 = cubic; softens the stick center for fine corrections */
  steerExpo?: MaybeRefOrGetter<number>
  stickDeadzone?: MaybeRefOrGetter<number>
}

/** Rescale past the deadzone so small inputs stay smooth instead of jumping */
function applyDeadzone(value: number, deadzone: number) {
  const magnitude = Math.abs(value)
  if (magnitude < deadzone) return 0
  return (Math.sign(value) * (magnitude - deadzone)) / (1 - deadzone)
}

/** Blend linear → cubic: keeps the endpoints, flattens the center */
function applyExpo(value: number, expo: number) {
  return (1 - expo) * value + expo * value ** 3
}

/**
 * Rescales a trigger back to 0..1.
 *
 * @kmamal/sdl 0.11 normalizes an axis whose mapping is a joystick axis through
 * `joystick::mapAxisValue`, which offsets by that axis' initial state and
 * divides by the *joystick* range (-32768..32767) — but it is handed the
 * *controller*-space trigger value, which SDL already reports as 0..32767. A
 * released trigger therefore reads 0.5 once SDL knows the axis' initial state,
 * and 0 before it does; a fully pressed one reads 1 either way.
 *
 * Both baselines mean released, so anything at or below the midpoint is 0 and
 * the upper half is stretched back over the full range. The cost is the bottom
 * half of the travel during the short window before SDL records the initial
 * state, which the trigger deadzone would swallow anyway.
 */
function triggerValue(reported: number) {
  return Math.max(0, reported * 2 - 1)
}

/**
 * RL-style bindings for a standard-mapping pad (EasySMX X20 etc.):
 * RT throttle, LT brake/reverse, left stick steer + air pitch/yaw,
 * A jump, B/RB boost, LB powerslide/air-roll mod, Y ball cam,
 * X rear view (hold), Select reset.
 */
export function useCarGamepad(options: CarGamepadOptions = {}) {
  const controller = useSdlController()

  const state = reactive({
    connected: false,
    id: '',
    /** forward = -1, reverse = +1 (same sign convention as the keyboard axes) */
    forward: 0,
    /** air pitch from stick Y: up = nose down = -1, matching W on keyboard */
    pitch: 0,
    /** left = +1 (stick left reports -1 on the horizontal axis) */
    right: 0,
    boost: false,
    slide: false,
    jumpHeld: false,
    ballCamPressed: false,
    rearViewHeld: false,
    resetHeld: false,
    // Raw values for the on-screen indicator
    throttle: 0,
    brake: 0,
    stickX: 0,
    stickY: 0,
    pressedButtons: [] as string[],
  })

  function clear() {
    state.connected = false
    state.id = ''
    state.forward = 0
    state.pitch = 0
    state.right = 0
    state.boost = false
    state.slide = false
    state.jumpHeld = false
    state.ballCamPressed = false
    state.rearViewHeld = false
    state.resetHeld = false
    state.throttle = 0
    state.brake = 0
    state.stickX = 0
    state.stickY = 0
    if (state.pressedButtons.length) state.pressedButtons = []
  }

  onFrame(() => {
    const pad = controller.value
    if (!pad || pad.closed) {
      if (state.connected) clear()
      return
    }

    const { axes, buttons } = pad

    state.connected = true
    state.id = pad.device.name

    const deadzone = toValue(options.stickDeadzone) ?? STICK_DEADZONE
    const sensitivity = toValue(options.steerSensitivity) ?? 1
    const expo = toValue(options.steerExpo) ?? 0

    state.throttle = applyDeadzone(triggerValue(axes.rightTrigger), TRIGGER_DEADZONE)
    state.brake = applyDeadzone(triggerValue(axes.leftTrigger), TRIGGER_DEADZONE)
    state.stickX = applyDeadzone(axes.leftStickX, deadzone)
    state.stickY = applyDeadzone(axes.leftStickY, deadzone)

    state.forward = state.brake - state.throttle
    state.pitch = applyExpo(state.stickY, expo)
    state.right = Math.max(-1, Math.min(1, -applyExpo(state.stickX, expo) * sensitivity))
    state.boost = buttons.b || buttons.rightShoulder
    state.slide = buttons.leftShoulder
    state.jumpHeld = buttons.a
    state.ballCamPressed = buttons.y
    state.rearViewHeld = buttons.x
    state.resetHeld = buttons.back

    // Reassign only when the set changes: this runs every frame, and the
    // indicator reading it re-renders the terminal on every write
    const pressed = Object.entries(buttons).flatMap(([name, down]) => (down ? [name] : []))
    if (pressed.join() !== state.pressedButtons.join()) {
      state.pressedButtons = pressed
    }
  })

  return state
}
