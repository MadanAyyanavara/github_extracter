export interface Coordinates {
  x: number
  z: number
}

export interface AiExplainer {
  purpose: string
  keyFunctions: string[]
  techDebtWarning: string
}

export interface CodeCityNode {
  id: string
  fileName: string
  relativePath: string
  language: string
  linesOfCode: number
  cognitiveComplexity: number
  gitChurnScore: number
  coordinates: Coordinates
  aiExplainer: AiExplainer
}

export interface CodeCityEdge {
  id: string
  sourceNodeId: string
  targetNodeId: string
  dependencyType: string
  aiDescription: string
}

export interface LogicIntersect {
  flowName: string
  description: string
}

export interface AiDeepDives {
  architectureBlueprint: string
  logicIntersects: LogicIntersect[]
}

export interface RepoMetadata {
  repositoryName: string
  primaryLanguage: string
  architecturePattern: string
  aiExecutiveSummary: string
}

export interface VisualCanvasConfig {
  gridSizeX: number
  gridSizeZ: number
}

export interface RepoAnalysis {
  repoMetadata: RepoMetadata
  visualCanvasConfig: VisualCanvasConfig
  nodes: CodeCityNode[]
  edges: CodeCityEdge[]
  aiDeepDives: AiDeepDives
}

export interface TimelineEntry {
  commitSha: string
  commitDate: string
  commitMessage: string
}
