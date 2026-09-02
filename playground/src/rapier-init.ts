// Rapier's solver has to have *run once* before OpenTUI's renderer boots.
// Otherwise its first `world.step()` traps with `RuntimeError: unreachable` (a
// Rust panic) and every later call fails with "recursive use of an object
// detected which would lead to unsafe aliasing in rust". Loading the wasm early
// is not enough — the code has to execute. Minimal repro, no Vue, no TresJS:
//
//   await RAPIER.init()
//   await createCliRenderer({})              // from @opentui/core
//   world.step(new RAPIER.EventQueue(true))   // RuntimeError: unreachable
//
// Move one `step()` above `createCliRenderer` and everything afterwards works,
// including scenes far richer than the warmed-up one (box stacks, contact-force
// events, debugRender, removing bodies), so this is not per-function lazy
// compilation — something about loading the renderer's native library breaks
// wasm code that V8 generates later. Nothing else about the terminal 3D stack
// does it: a Dawn device, a worker thread, dlopen'ing libopentui by hand and
// OpenTUI's own yoga/tree-sitter wasm all leave Rapier working.
//
// Page modules are imported (and their top-level await resolved) while main.ts
// is still loading, so importing this from a page runs it before `createApp`.
// Every page then pays the ~30ms wasm init, which a playground can afford.
import RAPIER from '@dimforge/rapier3d-compat'

await RAPIER.init()

const world = new RAPIER.World({ x: 0, y: -9.81, z: 0 })
const floor = world.createRigidBody(RAPIER.RigidBodyDesc.fixed())
world.createCollider(RAPIER.ColliderDesc.cuboid(1, 0.1, 1), floor)
const ball = world.createRigidBody(RAPIER.RigidBodyDesc.dynamic().setTranslation(0, 1, 0))
world.createCollider(RAPIER.ColliderDesc.ball(0.25), ball)

// a bounce's worth of steps: enough contact/solver work to warm the module up
const events = new RAPIER.EventQueue(true)
for (let step = 0; step < 60; step++) {
  world.step(events)
}
events.free()
world.free()
