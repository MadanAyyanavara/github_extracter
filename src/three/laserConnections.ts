import * as THREE from 'three'
import { CodeCityNode, CodeCityEdge } from '@/types/repoAnalysis'

export const buildLaserLines = (
  nodes: CodeCityNode[],
  edges: CodeCityEdge[],
  selectedNodeId: string | null,
  accentColor: string
): THREE.Group => {
  const group = new THREE.Group()

  if (!selectedNodeId) {
    return group
  }

  const selectedNode = nodes.find((n) => n.id === selectedNodeId)
  if (!selectedNode) {
    return group
  }

  // Build node lookup for fast access
  const nodeMap = new Map<string, CodeCityNode>()
  nodes.forEach((node) => nodeMap.set(node.id, node))

  const outgoingEdges = edges.filter((e) => e.sourceNodeId === selectedNodeId)
  const incomingEdges = edges.filter((e) => e.targetNodeId === selectedNodeId)

  const sourcePos = new THREE.Vector3(
    selectedNode.coordinates.x,
    Math.max(0.5, Math.log10(selectedNode.linesOfCode) * 3) / 2,
    selectedNode.coordinates.z
  )

  // Outgoing connections (cyan)
  outgoingEdges.forEach((edge) => {
    const targetNode = nodeMap.get(edge.targetNodeId)
    if (targetNode) {
      const targetPos = new THREE.Vector3(
        targetNode.coordinates.x,
        Math.max(0.5, Math.log10(targetNode.linesOfCode) * 3) / 2,
        targetNode.coordinates.z
      )

      const points = [sourcePos, targetPos]
      const geometry = new THREE.BufferGeometry().setFromPoints(points)
      const material = new THREE.LineBasicMaterial({
        color: accentColor,
        linewidth: 2,
        blending: THREE.AdditiveBlending,
        transparent: true,
        opacity: 0.8,
      })
      const line = new THREE.Line(geometry, material)
      group.add(line)
    }
  })

  // Incoming connections (purple)
  incomingEdges.forEach((edge) => {
    const sourceNode = nodeMap.get(edge.sourceNodeId)
    if (sourceNode) {
      const otherPos = new THREE.Vector3(
        sourceNode.coordinates.x,
        Math.max(0.5, Math.log10(sourceNode.linesOfCode) * 3) / 2,
        sourceNode.coordinates.z
      )

      const points = [otherPos, sourcePos]
      const geometry = new THREE.BufferGeometry().setFromPoints(points)
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
