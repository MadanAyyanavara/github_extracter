import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { easeInOutCubic } from '@/utils/easing'

interface TweenState {
  active: boolean
  startTime: number
  cancelled: boolean
}

export const tweenCameraTo = (
  camera: THREE.PerspectiveCamera,
  controls: OrbitControls,
  targetPosition: THREE.Vector3,
  durationMs = 800
): (() => void) => {
  const state: TweenState = {
    active: true,
    startTime: performance.now(),
    cancelled: false,
  }

  const startPos = camera.position.clone()
  const startTarget = controls.target.clone()
  const targetWithOffset = targetPosition.clone()

  const animate = (time: number) => {
    if (state.cancelled || !state.active) return

    const elapsed = time - state.startTime
    const progress = Math.min(elapsed / durationMs, 1)
    const eased = easeInOutCubic(progress)

    camera.position.lerpVectors(startPos, targetWithOffset, eased)
    controls.target.lerpVectors(startTarget, targetPosition, eased)
    controls.update()

    if (progress < 1) {
      requestAnimationFrame(animate)
    } else {
      state.active = false
    }
  }

  requestAnimationFrame(animate)

  return () => {
    state.cancelled = true
  }
}
