import { RepoAnalysis, TimelineEntry } from '@/types/repoAnalysis'
import { mockRepoAnalysis } from './mockRepoAnalysis'

const makeSnapshot = (
  commitSha: string,
  commitDate: string,
  commitMessage: string,
  nodeOverrides: Record<string, Partial<(typeof mockRepoAnalysis)['nodes'][0]>>,
  nodeAbsences: string[]
): RepoAnalysis & { meta: TimelineEntry } => {
  const baseSnapshot = mockRepoAnalysis

  const filteredNodes = baseSnapshot.nodes
    .filter((node: any) => !nodeAbsences.includes(node.id))
    .map((node: any) => ({
      ...node,
      ...nodeOverrides[node.id],
    }))

  const filteredEdges = baseSnapshot.edges.filter(
    (edge: any) => !nodeAbsences.includes(edge.sourceNodeId) && !nodeAbsences.includes(edge.targetNodeId)
  )

  return {
    ...baseSnapshot,
    nodes: filteredNodes,
    edges: filteredEdges,
    meta: {
      commitSha,
      commitDate,
      commitMessage,
    },
  } as any
}

export const mockTimeline: (RepoAnalysis & { meta: TimelineEntry })[] = [
  makeSnapshot(
    'abc1234567890def1234567890def123456',
    '2025-06-01',
    'Initial monolith setup with auth and basic orders',
    {
      'node-6': { linesOfCode: 200, cognitiveComplexity: 25 },
      'node-9': { linesOfCode: 150, cognitiveComplexity: 10 },
    },
    ['node-7', 'node-11', 'node-12', 'node-14']
  ),
  makeSnapshot(
    'def1234567890abc1234567890abc12345678',
    '2025-06-15',
    'Add analytics and reporting infrastructure',
    {
      'node-6': { linesOfCode: 280, cognitiveComplexity: 32 },
      'node-7': { linesOfCode: 200, cognitiveComplexity: 16 },
    },
    ['node-11', 'node-12']
  ),
  makeSnapshot(
    '789def1234567890abc1234567890abcdef12',
    '2025-07-01',
    'Introduce event workers for async processing',
    {
      'node-6': { linesOfCode: 350, cognitiveComplexity: 36 },
      'node-7': { linesOfCode: 280, cognitiveComplexity: 20 },
      'node-10': { linesOfCode: 180, cognitiveComplexity: 12 },
      'node-11': { linesOfCode: 120, cognitiveComplexity: 8 },
      'node-12': { linesOfCode: 100, cognitiveComplexity: 7 },
    },
    []
  ),
  makeSnapshot(
    '234567890abc1234567890def123456789abcdef',
    '2025-07-10',
    'Refactor payment integration and add caching',
    {
      'node-6': { linesOfCode: 400, cognitiveComplexity: 39, gitChurnScore: 0.75 },
      'node-9': { linesOfCode: 300, cognitiveComplexity: 18, gitChurnScore: 0.65 },
      'node-2': { linesOfCode: 220, cognitiveComplexity: 16, gitChurnScore: 0.7 },
      'node-20': { linesOfCode: 180, cognitiveComplexity: 10 },
    },
    []
  ),
  makeSnapshot(
    '567890abcdef123456789abcdef12345678901234',
    '2025-07-19',
    'Add webhook dispatch worker and notification dedup',
    {
      'node-6': { linesOfCode: 450, cognitiveComplexity: 42, gitChurnScore: 0.85 },
      'node-8': { linesOfCode: 200, cognitiveComplexity: 13, gitChurnScore: 0.45 },
      'node-12': { linesOfCode: 140, cognitiveComplexity: 9 },
    },
    []
  ),
  makeSnapshot(
    'fedcba9876543210fedcba9876543210fedcba98',
    '2025-07-25',
    'Decompose legacy validator, mark as deprecated',
    {
      'node-6': { linesOfCode: 450, cognitiveComplexity: 42, gitChurnScore: 0.85 },
      'node-2': { linesOfCode: 180, cognitiveComplexity: 12, gitChurnScore: 0.5 },
    },
    ['node-3']
  ),
]
