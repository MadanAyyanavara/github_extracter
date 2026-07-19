import { CodeCityNode } from '@/types/repoAnalysis'

export const computeHeight = (linesOfCode: number): number => {
  return Math.max(0.5, Math.log10(linesOfCode) * 3)
}

export const computeFootprint = (cognitiveComplexity: number): number => {
  return Math.max(1.0, Math.sqrt(cognitiveComplexity))
}

const LANGUAGE_COLORS: Record<string, string> = {
  TypeScript: '#3178c6',
  JavaScript: '#f7df1e',
  Python: '#3776ab',
  Go: '#00add8',
  Java: '#007396',
  Rust: '#ce422b',
  'C++': '#00599c',
  'C#': '#239120',
  Ruby: '#cc342d',
  PHP: '#777bb4',
  Kotlin: '#7f52ff',
  Swift: '#fa7343',
  Default: '#94a3b8',
}

export const computeColor = (node: CodeCityNode, mode: 'language' | 'churn'): string => {
  if (mode === 'language') {
    return LANGUAGE_COLORS[node.language] || LANGUAGE_COLORS['Default']
  }

  const churn = Math.max(0, Math.min(1, node.gitChurnScore))
  const hue = 120 - churn * 120
  const saturation = 70 + churn * 30
  const lightness = 45 + churn * 5

  return `hsl(${hue}, ${saturation}%, ${lightness}%)`
}
