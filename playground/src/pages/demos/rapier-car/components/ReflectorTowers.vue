<script setup lang="ts">
// The lab's corner floodlights. Its low-poly reflector GLTF is a pole/arm/head
// built from primitives here (see ./car-model), modelled in the same local units
// so the head offset and aiming math are unchanged.
import { Color, type SpotLight } from 'three'

type ArrayVec3 = [number, number, number]

const CORNER_OFFSET = 45.5
const MODEL_SCALE = 2.5
// Lamp head local offset (model faces -Z, base at y=0, ~8 units tall)
const HEAD_OFFSET = { y: 7.1, z: -1.7 }
// Group-local units: the group is scaled, so divide out MODEL_SCALE
const TARGET_DISTANCE = Math.hypot(CORNER_OFFSET, CORNER_OFFSET) / MODEL_SCALE

const ARM_LENGTH = Math.abs(HEAD_OFFSET.z)

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
    <TresMesh cast-shadow :position="[0, HEAD_OFFSET.y / 2, 0]">
      <TresCylinderGeometry :args="[0.16, 0.22, HEAD_OFFSET.y, 8]" />
      <TresMeshStandardMaterial color="#64748b" :roughness="0.6" :metalness="0.15" />
    </TresMesh>

    <!-- Arm reaching toward the arena, with the lamp housing on its tip -->
    <TresMesh cast-shadow :position="[0, HEAD_OFFSET.y - 0.05, HEAD_OFFSET.z / 2]">
      <TresBoxGeometry :args="[0.22, 0.22, ARM_LENGTH]" />
      <TresMeshStandardMaterial color="#64748b" :roughness="0.6" :metalness="0.15" />
    </TresMesh>

    <TresMesh cast-shadow :position="[0, HEAD_OFFSET.y, HEAD_OFFSET.z]">
      <TresBoxGeometry :args="[1.9, 1.3, 0.5]" />
      <TresMeshStandardMaterial color="#475569" :roughness="0.5" :metalness="0.15" />
    </TresMesh>

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
