import { RepoAnalysis, TimelineEntry } from '@/types/repoAnalysis'
import { mockRepoAnalysis } from '@/mock/mockRepoAnalysis'
import { mockTimeline } from '@/mock/mockTimeline'
import { API_BASE_URL, USE_MOCK_DATA, MOCK_LATENCY_MS } from './config'

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export const fetchRepoAnalysis = async (repoUrl: string, opts?: { commitSha?: string }): Promise<RepoAnalysis> => {
  if (USE_MOCK_DATA) {
    await delay(MOCK_LATENCY_MS)

    if (opts?.commitSha) {
      const snapshot = mockTimeline.find((s) => s.meta.commitSha === opts.commitSha)
      if (snapshot) {
        const { meta: _meta, ...analysis } = snapshot as any
        return analysis as RepoAnalysis
      }
    }

    return mockRepoAnalysis
  }

  const response = await fetch(`${API_BASE_URL}/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ repoUrl, commitSha: opts?.commitSha }),
  })

  if (!response.ok) {
    throw new Error(`Failed to analyze repo: ${response.statusText}`)
  }

  return response.json()
}

export const fetchCommitTimeline = async (repoUrl: string): Promise<TimelineEntry[]> => {
  if (USE_MOCK_DATA) {
    await delay(MOCK_LATENCY_MS)
    return mockTimeline.map((s) => s.meta)
  }

  const response = await fetch(`${API_BASE_URL}/timeline`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ repoUrl }),
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch timeline: ${response.statusText}`)
  }

  return response.json()
}
