import { create } from 'zustand'
import { RepoAnalysis, TimelineEntry } from '@/types/repoAnalysis'
import { fetchRepoAnalysis, fetchCommitTimeline } from '@/api/fetchRepoAnalysis'

interface CameraFocusRequest {
  nodeId: string
  nonce: number
}

interface CodeCityStore {
  repoAnalysis: RepoAnalysis | null
  timeline: TimelineEntry[]
  scrubIndex: number
  selectedNodeId: string | null
  cameraFocusRequest: CameraFocusRequest | null
  isDrawerOpen: boolean
  activeTab: 'overview' | 'architecture' | 'node'
  colorMode: 'language' | 'churn'

  loadRepoAnalysis: (repoUrl: string) => Promise<void>
  setScrubIndex: (index: number, repoUrl: string) => Promise<void>
  selectNode: (nodeId: string | null) => void
  focusNode: (nodeId: string) => void
  toggleDrawer: () => void
  setActiveTab: (tab: 'overview' | 'architecture' | 'node') => void
  setColorMode: (mode: 'language' | 'churn') => void
}

export const useCodeCityStore = create<CodeCityStore>((set, get) => ({
  repoAnalysis: null,
  timeline: [],
  scrubIndex: 0,
  selectedNodeId: null,
  cameraFocusRequest: null,
  isDrawerOpen: true,
  activeTab: 'overview',
  colorMode: 'language',

  loadRepoAnalysis: async (_repoUrl: string) => {
    try {
      const analysis = await fetchRepoAnalysis(_repoUrl)
      const timeline = await fetchCommitTimeline(_repoUrl)
      set({ repoAnalysis: analysis, timeline, scrubIndex: timeline.length - 1 })
    } catch (error) {
      console.error('Failed to load repo analysis:', error)
    }
  },

  setScrubIndex: async (_index: number, _repoUrl: string) => {
    const state = get()
    if (_index >= 0 && _index < state.timeline.length) {
      set({ scrubIndex: _index })
      const commitSha = state.timeline[_index].commitSha
      try {
        const analysis = await fetchRepoAnalysis(_repoUrl, { commitSha })
        set({ repoAnalysis: analysis })
        set({ selectedNodeId: null, cameraFocusRequest: null })
      } catch (error) {
        console.error('Failed to load snapshot:', error)
      }
    }
  },

  selectNode: (_nodeId: string | null) => {
    const state = get()
    if (_nodeId && !state.repoAnalysis?.nodes.some((n) => n.id === _nodeId)) {
      return
    }
    set({ selectedNodeId: _nodeId, activeTab: _nodeId ? 'node' : 'overview' })
  },

  focusNode: (_nodeId: string) => {
    const state = get()
    if (!state.repoAnalysis?.nodes.some((n) => n.id === _nodeId)) {
      return
    }
    set({
      selectedNodeId: _nodeId,
      activeTab: 'node',
      cameraFocusRequest: { nodeId: _nodeId, nonce: Date.now() },
    })
  },

  toggleDrawer: () => {
    set((state) => ({ isDrawerOpen: !state.isDrawerOpen }))
  },

  setActiveTab: (_tab: 'overview' | 'architecture' | 'node') => {
    set({ activeTab: _tab })
  },

  setColorMode: (_mode: 'language' | 'churn') => {
    set({ colorMode: _mode })
  },
}))
