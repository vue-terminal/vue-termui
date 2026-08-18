<script setup lang="ts">
// The lab's corner floodlights, on the original `low_poly_reflector.glb` (see
// ./models for what loading it in Node needs, and for the primitive mast the
// `simple` page draws instead).
import { Color, Mesh, type Object3D, type SpotLight } from 'three'
import { shallowRef, watch } from 'vue-termui'
import { useModel, type ModelStyle } from './models'

type ArrayVec3 = [number, number, number]

const CORNER_OFFSET = 45.5
const MODEL_SCALE = 2.5
// Lamp head local offset (model faces -Z, base at y=0, ~8 units tall)
const HEAD_OFFSET = { y: 7.1, z: -1.7 }
// Group-local units: the group is scaled, so divide out MODEL_SCALE
const TARGET_DISTANCE = Math.hypot(CORNER_OFFSET, CORNER_OFFSET) / MODEL_SCALE

const GLOW_SIZE: [number, number] = [1.7, 1.1]
// HDR color, as in the original where the bloom pass (threshold 1) picks the
// lamp face up
const GLOW_COLOR = new Color('#ffd9a8').multiplyScalar(2.5)

const CORNERS = (
  [
    [CORNER_OFFSET, CORNER_OFFSET],
    [-CORNER_OFFSET, CORNER_OFFSET],
    [CORNER_OFFSET, -CORNER_OFFSET],
    [-CORNER_OFFSET, -CORNER_OFFSET],
  ] as const
).map(([x, z]) => ({
  position: [x, 0, z] as ArrayVec3,
  // Yaw that points the model's -Z forward axis at the arena center
  yaw: Math.atan2(x, z),
}))

const props = defineProps<{ modelStyle: ModelStyle }>()

const reflector = useModel('reflector', props.modelStyle)
const towers = shallowRef<Object3D[]>([])

watch(
  reflector,
  (scene) => {
    if (!scene) return

    scene.traverse((child: Object3D) => {
      if (child instanceof Mesh) {
        child.castShadow = true
        child.receiveShadow = true
      }
    })

    towers.value = CORNERS.map(() => scene.clone(true))
  },
  { immediate: true },
)

// Aim each spotlight at the arena center: the target rides as a child of the
// light so the group yaw orients it, no manual scene bookkeeping needed
function aimSpotlight(el: SpotLight | null) {
  if (!el) return
  el.target.position.set(0, -HEAD_OFFSET.y, HEAD_OFFSET.z - TARGET_DISTANCE)
  el.add(el.target)
}
</script>

<template>
  <TresGroup
    v-for="(corner, index) in CORNERS"
    :key="`reflector-${index}`"
    :position="corner.position"
    :rotation="[0, corner.yaw, 0]"
    :scale="MODEL_SCALE"
  >
    <primitive v-if="towers[index]" :object="towers[index]" />

    <!-- Lamp face glow -->
    <TresMesh :position="[0, HEAD_OFFSET.y, HEAD_OFFSET.z - 0.3]" :rotation="[-0.15, Math.PI, 0]">
      <TresPlaneGeometry :args="GLOW_SIZE" />
      <TresMeshBasicMaterial :color="GLOW_COLOR" :tone-mapped="false" />
    </TresMesh>

    <TresSpotLight
      :ref="aimSpotlight"
      :position="[0, HEAD_OFFSET.y, HEAD_OFFSET.z]"
      color="#ffd9a8"
      :intensity="1.2"
      :angle="0.35"
      :penumbra="0.6"
      :decay="0"
    />
  </TresGroup>
</template>
