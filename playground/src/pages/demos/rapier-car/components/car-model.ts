// Stand-in for the original demo's `car.glb`: that model is Draco-compressed,
// and DRACOLoader decodes in a Worker built from a blob URL, which doesn't
// exist in Node. The names here are the ones the GLTF exports
// ('chassis', 'wheel-front-right', the four light parts), so CarComponent picks
// the parts up with the same `getObjectByName` calls as the original.
//
// Proportions follow the physics setup rather than the artwork: the chassis
// collider is a 1 x 0.55 x 2.4 half-extent cuboid and the wheels sit at
// x ±1, z ±1.5 with radius 0.5/0.6 (see WHEEL_OFFSETS).
import { BoxGeometry, CylinderGeometry, Group, Mesh, MeshStandardMaterial } from 'three'

const BODY = { width: 1.9, height: 0.7, length: 4.4 }
// chassis-local y: CarComponent lifts the whole group to y 0.4, and the collider
// is centered at y 0.15 in body space
const BODY_Y = 0.15 - 0.4
const CABIN = { width: 1.45, height: 0.5, length: 2.1 }
const WHEEL_RADIUS = 0.5
const WHEEL_WIDTH = 0.34

// Tires are a hair wider than tall so the terminal's ~1:2 cells still show them
const tireGeometry = new CylinderGeometry(WHEEL_RADIUS, WHEEL_RADIUS, WHEEL_WIDTH, 16)
const hubGeometry = new CylinderGeometry(0.22, 0.22, WHEEL_WIDTH + 0.04, 10)
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
  geometry: BoxGeometry | CylinderGeometry,
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

/** Root the original reads out of the GLTF's `Scene`. */
export function createCarModel(): Group {
  const root = new Group()
  root.name = 'Scene'
  root.add(createChassis(), createWheel())
  return root
}
