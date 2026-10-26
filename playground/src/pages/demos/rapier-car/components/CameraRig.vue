<script setup lang="ts">
// The lab demo's chase camera, lifted out of its page component: a yaw-only
// follow rig with Rocket-League ball cam, a rear view, boost FOV punch and a
// teleport/respawn snap. It rides Tres's onRender — the hook the original bound
// through <TresCanvas @loop> — which in the terminal is driven by the frame
// callback in <TresTerminal>, after the physics step of the same frame.
import { useLoop } from '@tresjs/core'
import { MathUtils, Vector3, type Object3D, type PerspectiveCamera, type Vector3Like } from 'three'
import { shallowRef } from 'vue-termui'

/** Subset of CarComponent's exposed surface the rig reads. */
interface CarHandle {
  chassisGroup?: () => Object3D | null
  boosting?: () => boolean
}

/** Subset of SceneWorld's exposed surface the rig reads. */
interface WorldHandle {
  ballPosition?: () => Vector3Like | null
}

const props = defineProps<{
  car?: CarHandle | null
  world?: WorldHandle | null
  ballCam: boolean
  rearView: boolean
}>()

const CAMERA_DISTANCE = 12
const CAMERA_HEIGHT = 5
const LOOK_AT_HEIGHT = 1.2
const CAMERA_LERP = 0.08
const CAMERA_BOOST_BLEND = 0.06
const CAMERA_FOV_BASE = 55
const CAMERA_FOV_BOOST = 68
const LOOK_AHEAD = 4
const CAMERA_MIN_HEIGHT = 3

const CAMERA_YAW_LERP = 0.06
const BALL_CAM_LERP = 0.1
// Position jump bigger than this in one frame = respawn → snap the camera behind the car
const TELEPORT_DISTANCE = 8
// Parked showing the car's front → pan back around after this long
const RESYNC_DELAY = 2.5
const RESYNC_YAW_SPEED = 2.5
const STOPPED_SPEED = 1.5

// plain shallowRef bound via the string ref: useTemplateRef wraps the value in a
// dev-only readonly proxy, which blocks mutating the camera per frame
const cameraRef = shallowRef<PerspectiveCamera | null>(null)

const desiredPosition = new Vector3()
const lookAtTarget = new Vector3()
const smoothedLookAt = new Vector3()
const lookAheadOffset = new Vector3()
const flatForward = new Vector3()
const toBall = new Vector3()
// Smoothed, sign-stable follow heading so flips don't whip the camera around
const followForward = new Vector3(0, 0, -1)
const prevCarPosition = new Vector3()
let prevViewKey = ''
let prevCarPositionInit = false
let resyncTimer = 0
let resyncing = false
let boostBlend = 0
let lookAtInitialized = false

/** Pan back behind the car, for resets that don't move it far enough to snap. */
function resync() {
  resyncing = true
}

defineExpose({ resync })

function followCarCamera(delta: number) {
  const chassisGroup = props.car?.chassisGroup?.()
  const camera = cameraRef.value

  if (!chassisGroup || !camera) return

  const boosting = props.car?.boosting?.() ?? false
  boostBlend = MathUtils.lerp(boostBlend, boosting ? 1 : 0, CAMERA_BOOST_BLEND)

  // Yaw-only follow: project car forward onto XZ so flips don't put the camera underground
  flatForward.set(0, 0, -1).applyQuaternion(chassisGroup.quaternion)
  flatForward.y = 0
  const hasHeading = flatForward.lengthSq() > 1e-4
  if (hasHeading) {
    flatForward.normalize()
  }

  // A big position jump means the car respawned → snap straight behind it
  const movedDistance = prevCarPositionInit ? prevCarPosition.distanceTo(chassisGroup.position) : 0
  const teleported = movedDistance > TELEPORT_DISTANCE
  const carSpeed = teleported ? 0 : movedDistance / Math.max(delta, 1e-4)
  prevCarPosition.copy(chassisGroup.position)
  prevCarPositionInit = true

  const ballPos = props.ballCam ? props.world?.ballPosition?.() : null
  const useBallCam = Boolean(ballPos)

  // Toggling ball cam / rear view cuts instantly, like RL
  const viewKey = `${useBallCam}:${props.rearView}`
  const snap = teleported || viewKey !== prevViewKey
  prevViewKey = viewKey

  if (useBallCam && ballPos) {
    resyncing = false
    resyncTimer = 0
    // Orbit the car so the ball stays centered
    toBall.set(ballPos.x - chassisGroup.position.x, 0, ballPos.z - chassisGroup.position.z)
    if (toBall.lengthSq() > 1e-4) {
      toBall.normalize()
      if (snap) {
        followForward.copy(toBall)
      } else {
        // Nearly-opposite headings stall a lerp; nudge sideways to pick a side
        if (toBall.dot(followForward) < -0.99) {
          followForward.x += 0.05
        }
        followForward.lerp(toBall, BALL_CAM_LERP).normalize()
      }
    }
  } else if (snap) {
    resyncing = false
    resyncTimer = 0
    if (hasHeading) {
      followForward.copy(flatForward)
    }
  } else if (hasHeading) {
    if (resyncing) {
      // Pan around to the car's true heading at a fixed yaw speed
      const currentYaw = Math.atan2(followForward.x, followForward.z)
      const targetYaw = Math.atan2(flatForward.x, flatForward.z)
      let deltaYaw = targetYaw - currentYaw
      deltaYaw = ((((deltaYaw + Math.PI) % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2)) - Math.PI
      const step = RESYNC_YAW_SPEED * delta
      const done = Math.abs(deltaYaw) <= step
      const yaw = done ? targetYaw : currentYaw + Math.sign(deltaYaw) * step
      followForward.set(Math.sin(yaw), 0, Math.cos(yaw))
      if (done) {
        resyncing = false
        resyncTimer = 0
      }
    } else {
      const facingAway = flatForward.dot(followForward) < 0

      // Parked while the camera shows the front → pan back after a moment
      if (facingAway && carSpeed < STOPPED_SPEED) {
        resyncTimer += delta
        if (resyncTimer > RESYNC_DELAY) {
          resyncing = true
        }
      } else {
        resyncTimer = 0
      }

      // Mid-flip the nose points backwards for a moment; treat that as the same
      // heading so a back/front flip doesn't spin the camera 180° and back
      if (facingAway) {
        flatForward.negate()
      }
      followForward.lerp(flatForward, CAMERA_YAW_LERP).normalize()
    }
  }

  // Behind the car on the ground plane, always world-up for height.
  // Rear view mirrors the offset to the front, still looking back at the car/ball
  const behindSign = props.rearView ? 1 : -1
  desiredPosition.copy(chassisGroup.position)
  desiredPosition.addScaledVector(followForward, behindSign * CAMERA_DISTANCE)
  desiredPosition.y = chassisGroup.position.y + CAMERA_HEIGHT
  desiredPosition.y = Math.max(desiredPosition.y, CAMERA_MIN_HEIGHT)

  if (snap) {
    camera.position.copy(desiredPosition)
  } else {
    camera.position.lerp(desiredPosition, CAMERA_LERP)
  }
  // Hard floor so a flipped chassis never drags the smoothed cam under the ground
  camera.position.y = Math.max(camera.position.y, CAMERA_MIN_HEIGHT)

  if (useBallCam && ballPos) {
    lookAtTarget.set(ballPos.x, ballPos.y, ballPos.z)
  } else {
    lookAheadOffset.copy(followForward).multiplyScalar(LOOK_AHEAD * boostBlend)
    lookAtTarget.copy(chassisGroup.position)
    lookAtTarget.y = chassisGroup.position.y + LOOK_AT_HEIGHT
    lookAtTarget.add(lookAheadOffset)
  }

  if (!lookAtInitialized || snap) {
    smoothedLookAt.copy(lookAtTarget)
    lookAtInitialized = true
  } else {
    smoothedLookAt.lerp(lookAtTarget, CAMERA_LERP)
  }
  camera.lookAt(smoothedLookAt)

  const targetFov = MathUtils.lerp(CAMERA_FOV_BASE, CAMERA_FOV_BOOST, boostBlend)
  if (Math.abs(camera.fov - targetFov) > 0.01) {
    camera.fov = MathUtils.lerp(camera.fov, targetFov, CAMERA_BOOST_BLEND)
    camera.updateProjectionMatrix()
  }
}

const { onRender } = useLoop()
onRender(({ delta }) => followCarCamera(delta))
</script>

<template>
  <TresPerspectiveCamera
    ref="cameraRef"
    :position="[0, CAMERA_HEIGHT, CAMERA_DISTANCE]"
    :fov="CAMERA_FOV_BASE"
    :near="0.1"
    :far="500"
  />
</template>
