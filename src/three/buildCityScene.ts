import * as THREE from 'three'
import { CodeCityNode, Coordinates } from '@/types/repoAnalysis'
import { computeHeight, computeFootprint, computeColor } from '@/layout/cityMetrics'

export interface CityMeshes {
  group: THREE.Group
  meshesById: Map<string, THREE.Mesh>
}

export const buildCityMeshes = (
  nodes: CodeCityNode[],
  layoutCoords: Map<string, Coordinates>,
  colorMode: 'language' | 'churn'
): CityMeshes => {
  const group = new THREE.Group()
  const meshesById = new Map<string, THREE.Mesh>()

  nodes.forEach((node) => {
    const coords = layoutCoords.get(node.id) || { x: 0, z: 0 }
    const height = computeHeight(node.linesOfCode)
    const footprint = computeFootprint(node.cognitiveComplexity)
    const color = computeColor(node, colorMode)

    const geometry = new THREE.BoxGeometry(footprint, height, footprint)
    const material = new THREE.MeshStandardMaterial({
      color,
      metalness: 0.3,
      roughness: 0.6,
      emissive: new THREE.Color(color).multiplyScalar(0.2),
    })

    const mesh = new THREE.Mesh(geometry, material)
    mesh.position.set(coords.x, height / 2, coords.z)
    mesh.castShadow = true
    mesh.receiveShadow = true
    mesh.userData = { nodeId: node.id }

    group.add(mesh)
    meshesById.set(node.id, mesh)
  })

  return { group, meshesById }
}
