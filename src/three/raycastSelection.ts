import * as THREE from 'three'

export const pickNodeAtPointer = (
  event: PointerEvent,
  canvas: HTMLCanvasElement,
  camera: THREE.Camera,
  meshesById: Map<string, THREE.Mesh>
): string | null => {
  const rect = canvas.getBoundingClientRect()
  const x = ((event.clientX - rect.left) / rect.width) * 2 - 1
  const y = -((event.clientY - rect.top) / rect.height) * 2 + 1

  const raycaster = new THREE.Raycaster()
  raycaster.setFromCamera(new THREE.Vector2(x, y), camera)

  const meshes = Array.from(meshesById.values())
  const intersects = raycaster.intersectObjects(meshes)

  if (intersects.length > 0) {
    const hit = intersects[0].object as THREE.Mesh
    return hit.userData.nodeId || null
  }

  return null
}
