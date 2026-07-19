import { RepoAnalysis, TimelineEntry } from '@/types/repoAnalysis'
import { mockRepoAnalysis } from '@/mock/mockRepoAnalysis'
import { mockTimeline } from '@/mock/mockTimeline'
import { API_BASE_URL, USE_MOCK_DATA, MOCK_LATENCY_MS } from './config'

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

let backendAvailable: boolean | null = null
let backendCheckTime = 0
const BACKEND_CHECK_INTERVAL = 5000

const checkBackendAvailability = async (): Promise<boolean> => {
  const now = Date.now()
  if (backendAvailable !== null && now - backendCheckTime < BACKEND_CHECK_INTERVAL) {
    return backendAvailable
  }

  try {
    const response = await fetch(`${API_BASE_URL}/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(2000),
    })
    backendAvailable = response.ok
    backendCheckTime = now
    return backendAvailable
  } catch {
    backendAvailable = false
    backendCheckTime = now
    return false
  }
}

const shouldUseMockData = async (): Promise<boolean> => {
  if (USE_MOCK_DATA) return true
  const isBackendUp = await checkBackendAvailability()
  return !isBackendUp
}

export const fetchRepoAnalysis = async (
  repoUrl: string,
  opts?: { commitSha?: string }
): Promise<RepoAnalysis> => {
  const useMock = await shouldUseMockData()

  if (useMock) {
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

  try {
    const response = await fetch(`${API_BASE_URL}/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ repoUrl, commitSha: opts?.commitSha }),
      signal: AbortSignal.timeout(30000),
    })

    if (!response.ok) {
      console.warn(`Backend analysis failed (${response.status}), falling back to mock`)
      return mockRepoAnalysis
    }

    const data = await response.json()
    return data as RepoAnalysis
  } catch (error) {
    console.warn('Backend unreachable, using mock data:', error)
    backendAvailable = false
    return mockRepoAnalysis
  }
}

export const fetchCommitTimeline = async (repoUrl: string): Promise<TimelineEntry[]> => {
  const useMock = await shouldUseMockData()

  if (useMock) {
    await delay(MOCK_LATENCY_MS)
    return mockTimeline.map((s) => s.meta)
  }

  try {
    const response = await fetch(`${API_BASE_URL}/timeline`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ repoUrl }),
      signal: AbortSignal.timeout(30000),
    })

    if (!response.ok) {
      console.warn(`Backend timeline failed (${response.status}), falling back to mock`)
      return mockTimeline.map((s) => s.meta)
    }

    const data = await response.json()
    return data as TimelineEntry[]
  } catch (error) {
    console.warn('Backend timeline unreachable, using mock data:', error)
    backendAvailable = false
    return mockTimeline.map((s) => s.meta)
  }
}

export const getBackendStatus = (): boolean | null => backendAvailable
