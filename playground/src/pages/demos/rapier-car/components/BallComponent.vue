<script setup lang="ts">
// Port of the lab's BallComponent. The GLTF ball is a low-poly sphere here (see
// ./car-model for why models are procedural), keeping the pulsing emissive
// "bubble" material the original animates.
import { CoefficientCombineRule, Quaternion, Vector3 } from '@dimforge/rapier3d-compat'
import { useLoop } from '@tresjs/core'
import { BallCollider, type ExposedRigidBody, RigidBody } from '@tresjs/rapier'
import { MeshStandardMaterial } from 'three'
import { shallowRef, watch } from 'vue-termui'

const BALL_RADIUS = 2.94
const FALL_RESET_Y = -8
const BALL_SPAWN = new Vector3(0, BALL_RADIUS + 3, -8)
// Ball restitution wins over the ground's (Max rule), so this IS the bounce
const BALL_RESTITUTION = 0.75
const BUBBLE_PULSE_SPEED = 2.5
const BUBBLE_EMISSIVE_MIN = 0.6
const BUBBLE_EMISSIVE_MAX = 2.4

const ballRef = shallowRef<ExposedRigidBody | null>(null)

const bubbleMaterial = new MeshStandardMaterial({
  color: '#dbeafe',
  emissive: '#38bdf8',
  emissiveIntensity: BUBBLE_EMISSIVE_MIN,
  roughness: 0.25,
  metalness: 0.1,
  // HDR emissive, as in the original: the browser demo lets its bloom pass
  // (threshold 1) pick the pulse up
  toneMapped: false,
})

function reset() {
  const body = ballRef.value?.instance
  if (!body) return

  body.setTranslation(BALL_SPAWN, true)
  body.setRotation(new Quaternion(0, 0, 0, 1), true)
  body.setLinvel(new Vector3(0, 0, 0), true)
  body.setAngvel(new Vector3(0, 0, 0), true)
  body.wakeUp()
}

defineExpose({
  reset,
  position: () => ballRef.value?.instance?.translation() ?? null,
})

watch(
  () => ballRef.value?.instance,
  (body) => {
    if (!body) return

    // Max rule: the ball's restitution applies instead of averaging with the ground's
    for (let i = 0; i < body.numColliders(); i++) {
      body.collider(i).setRestitutionCombineRule(CoefficientCombineRule.Max)
    }
    reset()
  },
)

const { onBeforeRender } = useLoop()
onBeforeRender(({ elapsed }) => {
  const body = ballRef.value?.instance
  if (!body) return
  if (body.translation().y < FALL_RESET_Y) {
    reset()
  }

  const pulse = 0.5 + 0.5 * Math.sin(elapsed * BUBBLE_PULSE_SPEED)
  bubbleMaterial.emissiveIntensity =
    BUBBLE_EMISSIVE_MIN + (BUBBLE_EMISSIVE_MAX - BUBBLE_EMISSIVE_MIN) * pulse
})
</script>

<template>
  <RigidBody ref="ballRef" :collider="false" :position="[BALL_SPAWN.x, BALL_SPAWN.y, BALL_SPAWN.z]">
    <BallCollider
      :args="[BALL_RADIUS]"
      :position="[0, 0, 0]"
      :restitution="BALL_RESTITUTION"
      :friction="0.55"
      :mass="2"
    />
    <TresMesh cast-shadow receive-shadow :material="bubbleMaterial">
      <TresSphereGeometry :args="[BALL_RADIUS, 24, 16]" />
    </TresMesh>
  </RigidBody>
</template>
