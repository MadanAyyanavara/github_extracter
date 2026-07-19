import { CodeCityNode, CodeCityEdge, Coordinates } from '@/types/repoAnalysis'

export const computeFallbackCoordinates = (
  nodes: CodeCityNode[],
  edges: CodeCityEdge[],
  gridSizeX: number,
  gridSizeZ: number
): Map<string, Coordinates> => {
  const nodeIds = new Set(nodes.map((n) => n.id))

  const fanIn = new Map<string, number>()
  const fanOut = new Map<string, number>()

  nodes.forEach((n) => {
    fanIn.set(n.id, 0)
    fanOut.set(n.id, 0)
  })

  edges.forEach((edge) => {
    if (nodeIds.has(edge.sourceNodeId) && nodeIds.has(edge.targetNodeId)) {
      fanIn.set(edge.targetNodeId, (fanIn.get(edge.targetNodeId) || 0) + 1)
      fanOut.set(edge.sourceNodeId, (fanOut.get(edge.sourceNodeId) || 0) + 1)
    }
  })

  const utilityScore = (nodeId: string) => {
    const inDegree = fanIn.get(nodeId) || 0
    const outDegree = fanOut.get(nodeId) || 0
    return inDegree - outDegree * 0.5
  }

  const nodesByScore = [...nodes].sort((a, b) => utilityScore(b.id) - utilityScore(a.id))

  const coords = new Map<string, Coordinates>()
  const totalNodes = nodesByScore.length
  const maxRadius = Math.max(gridSizeX, gridSizeZ) / 2

  nodesByScore.forEach((node, index) => {
    const normalizedRank = index / Math.max(1, totalNodes - 1)
    const radius = normalizedRank * maxRadius * 0.8

    const angle = (Math.random() * 2 * Math.PI)
    const x = radius * Math.cos(angle)
    const z = radius * Math.sin(angle)

    coords.set(node.id, {
      x: Math.round(x * 100) / 100,
      z: Math.round(z * 100) / 100,
    })
  })

  return coords
}
