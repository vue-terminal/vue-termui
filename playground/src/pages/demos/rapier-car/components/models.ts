// The lab demo's GLTF models, loaded in Node instead of through Nuxt's
// `useGLTF`. Two things had to change:
//
// - The published `car.glb`/`ball.glb` are Draco-compressed and DRACOLoader
//   decodes in a Worker built from a blob URL, which does not exist here. The
//   copies under src/assets are the same models with the compression decoded
//   (and quantized instead), so plain GLTFLoader can read them.
// - Their textures are stripped: GLTFLoader decodes images through
//   `createImageBitmap`/`<img>`, neither of which Node has, and at terminal
//   resolution a texture lands well inside a single cell anyway. Materials keep
//   their factors, which is what actually shows.
//
// Everything else — node names, materials, dimensions — is untouched, so the
// components keep using the original's `getObjectByName` calls and the tune
// built around them (wheel radii, BALL_RADIUS, the reflector's head offset).
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { Mesh, MeshStandardMaterial, type Group, type Object3D } from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { shallowRef, type ShallowRef } from 'vue-termui'
import { createBallModel, createCarModel, createReflectorModel } from './simple-models'

/**
 * The models paint several parts as pure metal (`metalness: 1`), which reads as
 * the environment reflection — and with no tone mapping and no env map in the
 * terminal renderer, that reflection is the black background. Cap it so those
 * parts are lit like dielectrics and stay visible.
 */
const MAX_METALNESS = 0.25

// Reads from src/assets in dev; in a build Vite rewrites this to the emitted
// dist/assets file (https://vite.dev/guide/assets#new-url-url-import-meta-url).
function assetPath(file: string): string {
  return fileURLToPath(new URL(`../../../../assets/models/rapier-car/${file}`, import.meta.url))
}

const loader = new GLTFLoader()

function tameMetals(root: Object3D): void {
  root.traverse((child: Object3D) => {
    const mesh = child as Partial<Mesh>
    for (const material of [mesh.material].flat()) {
      if (material instanceof MeshStandardMaterial) {
        material.metalness = Math.min(material.metalness, MAX_METALNESS)
      }
    }
  })
}

/** Loads a `.glb` from src/assets and returns its scene. */
export async function loadModel(file: string): Promise<Group> {
  const data = await readFile(assetPath(file))
  // GLTFLoader wants a standalone ArrayBuffer; a Buffer's may be a pooled slice
  const buffer = data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength)
  const gltf = await new Promise<{ scene: Group }>((resolve, reject) => {
    loader.parse(buffer, '', resolve, reject)
  })
  tameMetals(gltf.scene)
  return gltf.scene
}

/**
 * Which set of models the scene draws: the demo's own GLTFs, or the primitive
 * stand-ins from ./simple-models.
 *
 * It is threaded through the scene as a prop rather than provide/inject: the
 * components that read it live inside `<TresCanvasContext>`, which mounts the
 * slot through Tres's own renderer, and injections from the page above it do not
 * reach that subtree.
 */
export type ModelStyle = 'gltf' | 'simple'

type ModelName = 'car' | 'ball' | 'reflector'

const GLTF_FILES: Record<ModelName, string> = {
  car: 'car.glb',
  ball: 'ball.glb',
  reflector: 'low_poly_reflector.glb',
}

const SIMPLE_BUILDERS: Record<ModelName, () => Group> = {
  car: createCarModel,
  ball: createBallModel,
  reflector: createReflectorModel,
}

/**
 * The scene graph for one model in the given style. Always a ref, filled in
 * synchronously for the primitives and on load for the GLTFs, so components have
 * a single code path. Read once: the style comes from the route, which remounts
 * the scene when it changes.
 */
export function useModel(name: ModelName, style: ModelStyle): ShallowRef<Group | null> {
  const model = shallowRef<Group | null>(null)

  if (style === 'simple') {
    model.value = SIMPLE_BUILDERS[name]()
  } else {
    void loadModel(GLTF_FILES[name]).then((scene) => {
      model.value = scene
    })
  }

  return model
}
