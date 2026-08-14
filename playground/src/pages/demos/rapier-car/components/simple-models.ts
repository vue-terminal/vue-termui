// Primitive stand-ins for the demo's three GLTF models, kept as a second look
// (see the `simple` page) — boxes and cylinders read cleanly at terminal
// resolution, where the real models' detail lands inside a cell.
//
// Each one mimics the GLTF it replaces closely enough that the components share
// a single code path: the same node names ('chassis', 'wheel-front-right', the
// four light parts, 'ball'), the same 'Mat.4' material name for the ball's
// pulsing bubble, the same 0.45 wheel radius (so CarComponent's `0.5 + radius`
// scale factor and its mount fudge put the wheels on the ground) and the same
// ~8-unit tower height as the reflector.
import {
  BoxGeometry,
  CylinderGeometry,
  Group,
  Mesh,
  MeshStandardMaterial,
  SphereGeometry,
  type BufferGeometry,
} from 'three'

// --- car -------------------------------------------------------------------

const BODY = { width: 1.9, height: 0.7, length: 4.4 }
// chassis-local y: CarComponent lifts the whole group to y 0.4, and the collider
// is centered at y 0.15 in body space
const BODY_Y = 0.15 - 0.4
const CABIN = { width: 1.45, height: 0.5, length: 2.1 }
// Matches the GLTF wheel so the shared scaling in CarComponent applies unchanged
const WHEEL_RADIUS = 0.45
const WHEEL_WIDTH = 0.4

const tireGeometry = new CylinderGeometry(WHEEL_RADIUS, WHEEL_RADIUS, WHEEL_WIDTH, 16)
const hubGeometry = new CylinderGeometry(0.2, 0.2, WHEEL_WIDTH + 0.04, 10)
const spokeGeometry = new BoxGeometry(WHEEL_WIDTH + 0.06, WHEEL_RADIUS * 1.7, 0.1)
// Cylinders extrude along Y; the wheels spin around X (see updateWheels), so
// bake the axis swap into the geometry and leave the object rotation free
for (const geometry of [tireGeometry, hubGeometry]) geometry.rotateZ(Math.PI / 2)

const paintMaterial = new MeshStandardMaterial({
  color: '#ea6a2a',
  roughness: 0.5,
  metalness: 0.12,
})
const windowMaterial = new MeshStandardMaterial({
  color: '#1e293b',
  roughness: 0.25,
  metalness: 0.25,
})
const tireMaterial = new MeshStandardMaterial({ color: '#18181b', roughness: 0.9 })
const rimMaterial = new MeshStandardMaterial({
  color: '#cbd5e1',
  roughness: 0.4,
  metalness: 0.25,
})

// Materials of the light parts are replaced wholesale by setupCarLights, so
// these only matter for the frame before it runs
const placeholderLightMaterial = new MeshStandardMaterial({ color: '#ffffff' })

function mesh(
  name: string,
  geometry: BufferGeometry,
  material: MeshStandardMaterial,
  position: [number, number, number],
): Mesh {
  const object = new Mesh(geometry, material)
  object.name = name
  object.position.set(...position)
  return object
}

function createChassis(): Group {
  const chassis = new Group()
  chassis.name = 'chassis'

  chassis.add(
    mesh('chassis-paint', new BoxGeometry(BODY.width, BODY.height, BODY.length), paintMaterial, [
      0,
      BODY_Y,
      0,
    ]),
    // Cabin sits on the rear half, so the car reads as facing -Z
    mesh(
      'chassis-window',
      new BoxGeometry(CABIN.width, CABIN.height, CABIN.length),
      windowMaterial,
      [0, BODY_Y + (BODY.height + CABIN.height) / 2, 0.35],
    ),
    // A single mesh per light part: setupCarLights tracks one material per key
    mesh('front-lights', new BoxGeometry(1.5, 0.18, 0.12), placeholderLightMaterial, [
      0,
      BODY_Y + 0.05,
      -BODY.length / 2,
    ]),
    mesh('back-lights', new BoxGeometry(1.6, 0.16, 0.12), placeholderLightMaterial, [
      0,
      BODY_Y + 0.1,
      BODY.length / 2,
    ]),
    mesh('boost-lights', new BoxGeometry(0.75, 0.24, 0.14), placeholderLightMaterial, [
      0,
      BODY_Y - 0.2,
      BODY.length / 2,
    ]),
    // Trailing plume behind the exhaust; hidden until the car boosts
    mesh('boost-trails', new BoxGeometry(0.55, 0.22, 2.6), placeholderLightMaterial, [
      0,
      BODY_Y - 0.2,
      BODY.length / 2 + 1.4,
    ]),
  )

  return chassis
}

// The prototype wheel CarComponent clones four times; its own transform is
// overwritten per frame, so everything is modelled around the origin
function createWheel(): Group {
  const wheel = new Group()
  wheel.name = 'wheel-front-right'
  wheel.add(
    mesh('wheel-tire', tireGeometry, tireMaterial, [0, 0, 0]),
    mesh('wheel-hub', hubGeometry, rimMaterial, [0, 0, 0]),
    mesh('wheel-spoke', spokeGeometry, rimMaterial, [0, 0, 0]),
  )
  return wheel
}

/** Stands in for `car.glb`: the root the components read parts out of. */
export function createCarModel(): Group {
  const root = new Group()
  root.name = 'Scene'
  root.add(createChassis(), createWheel())
  return root
}

// --- ball ------------------------------------------------------------------

// The GLTF ball's own visual radius, a hair under its collider (BALL_RADIUS)
const BALL_VISUAL_RADIUS = 2.875

/**
 * Stands in for `ball.glb`. The material carries the GLTF's `Mat.4` name so
 * BallComponent picks it up as the pulsing bubble with no special-casing.
 */
export function createBallModel(): Group {
  const root = new Group()
  root.name = 'Scene'

  const ball = new Group()
  ball.name = 'ball'

  const material = new MeshStandardMaterial({
    color: '#dbeafe',
    emissive: '#38bdf8',
    roughness: 0.25,
    metalness: 0.1,
  })
  material.name = 'Mat.4'

  ball.add(mesh('ball-mesh', new SphereGeometry(BALL_VISUAL_RADIUS, 24, 16), material, [0, 0, 0]))
  root.add(ball)
  return root
}

// --- reflector tower -------------------------------------------------------

// Lamp head local offset of the GLTF, which ReflectorTowers also aims by
const HEAD_OFFSET = { y: 7.1, z: -1.7 }
const ARM_LENGTH = Math.abs(HEAD_OFFSET.z)

const towerMaterial = new MeshStandardMaterial({
  color: '#64748b',
  roughness: 0.6,
  metalness: 0.15,
})
const housingMaterial = new MeshStandardMaterial({
  color: '#475569',
  roughness: 0.5,
  metalness: 0.15,
})

/** Stands in for `low_poly_reflector.glb`: mast, arm and lamp housing. */
export function createReflectorModel(): Group {
  const tower = new Group()
  tower.name = 'reflector'
  tower.add(
    mesh('tower-mast', new CylinderGeometry(0.16, 0.22, HEAD_OFFSET.y, 8), towerMaterial, [
      0,
      HEAD_OFFSET.y / 2,
      0,
    ]),
    // Arm reaching toward the arena, with the lamp housing on its tip
    mesh('tower-arm', new BoxGeometry(0.22, 0.22, ARM_LENGTH), towerMaterial, [
      0,
      HEAD_OFFSET.y - 0.05,
      HEAD_OFFSET.z / 2,
    ]),
    mesh('tower-head', new BoxGeometry(1.9, 1.3, 0.5), housingMaterial, [
      0,
      HEAD_OFFSET.y,
      HEAD_OFFSET.z,
    ]),
  )
  return tower
}
