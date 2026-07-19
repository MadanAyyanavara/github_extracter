import * as THREE from 'three'
import { CodeCityEdge } from '@/types/repoAnalysis'

export const buildLaserLines = (
  selectedNodeId: string | null,
  edges: CodeCityEdge[],
  meshesById: Map<string, THREE.Mesh>
): THREE.Group => {
  const group = new THREE.Group()

  if (!selectedNodeId) {
    return group
  }

  const outgoingEdges = edges.filter((e) => e.sourceNodeId === selectedNodeId)
  const incomingEdges = edges.filter((e) => e.targetNodeId === selectedNodeId)

  const sourceMesh = meshesById.get(selectedNodeId)
  if (!sourceMesh) {
    return group
  }

  const sourcePos = sourceMesh.position.clone()

  outgoingEdges.forEach((edge) => {
    const targetMesh = meshesById.get(edge.targetNodeId)
    if (targetMesh) {
      const targetPos = targetMesh.position.clone()
      const geometry = new THREE.BufferGeometry().setFromPoints([sourcePos, targetPos])
      const material = new THREE.LineBasicMaterial({
        color: 0x5eead4,
        linewidth: 2,
        blending: THREE.AdditiveBlending,
        transparent: true,
        opacity: 0.8,
      })
      const line = new THREE.Line(geometry, material)
      group.add(line)
    }
  })

  incomingEdges.forEach((edge) => {
    const sourceMesh2 = meshesById.get(edge.sourceNodeId)
    if (sourceMesh2) {
      const otherPos = sourceMesh2.position.clone()
      const geometry = new THREE.BufferGeometry().setFromPoints([otherPos, sourcePos])
      const material = new THREE.LineBasicMaterial({
        color: 0xc084fc,
        linewidth: 2,
        blending: THREE.AdditiveBlending,
        transparent: true,
        opacity: 0.6,
      })
      const line = new THREE.Line(geometry, material)
      group.add(line)
    }
  })

  return group
}
