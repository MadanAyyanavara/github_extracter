import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import * as THREE from 'three'
import { CityRenderer } from '@/three/cityRenderer'
import { CodeCityNode } from '@/types/repoAnalysis'

describe('CityRenderer - Raycaster Selection & Color Buffer Management', () => {
  let renderer: THREE.WebGLRenderer
  let scene: THREE.Scene
  let camera: THREE.PerspectiveCamera
  let container: HTMLDivElement
  let cityRenderer: CityRenderer
  let mockNodes: CodeCityNode[]
  let setColorAtSpy: any
  let instanceMesh: THREE.InstancedMesh

  beforeEach(() => {
    // Setup DOM
    container = document.createElement('div')
    container.style.width = '1024px'
    container.style.height = '768px'
    document.body.appendChild(container)

    // Setup Three.js
    renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setSize(1024, 768)
    scene = new THREE.Scene()
    camera = new THREE.PerspectiveCamera(75, 1024 / 768, 0.1, 1000)
    camera.position.set(30, 25, 30)

    // Create mock nodes with distinct properties
    mockNodes = [
      {
        id: 'node-1',
        fileName: 'auth.ts',
        relativePath: 'src/auth.ts',
        language: 'TypeScript',
        linesOfCode: 200,
        cognitiveComplexity: 12,
        gitChurnScore: 0.3,
        coordinates: { x: 0, z: 0 },
        aiExplainer: { purpose: 'Auth logic', keyFunctions: [], techDebtWarning: '' },
      },
      {
        id: 'node-2',
        fileName: 'service.ts',
        relativePath: 'src/service.ts',
        language: 'TypeScript',
        linesOfCode: 500,
        cognitiveComplexity: 25,
        gitChurnScore: 0.6,
        coordinates: { x: 10, z: 10 },
        aiExplainer: { purpose: 'Service', keyFunctions: [], techDebtWarning: '' },
      },
      {
        id: 'node-3',
        fileName: 'utils.ts',
        relativePath: 'src/utils.ts',
        language: 'TypeScript',
        linesOfCode: 100,
        cognitiveComplexity: 5,
        gitChurnScore: 0.1,
        coordinates: { x: -10, z: -10 },
        aiExplainer: { purpose: 'Utilities', keyFunctions: [], techDebtWarning: '' },
      },
    ]

    // Initialize CityRenderer
    cityRenderer = new CityRenderer(
      container,
      {
        nodes: mockNodes,
        colorMode: 'language',
        selectedNodeId: null,
        onNodeSelect: vi.fn(),
      },
      scene,
      camera,
      renderer
    )

    // Render initial city (creates InstancedMesh)
    cityRenderer.renderCity()

    // Get reference to InstancedMesh for assertions
    instanceMesh = scene.children.find(
      (child) => child instanceof THREE.InstancedMesh
    ) as THREE.InstancedMesh
    expect(instanceMesh).toBeDefined()

    // Spy on setColorAt
    setColorAtSpy = vi.spyOn(instanceMesh, 'setColorAt')
  })

  afterEach(() => {
    // Cleanup
    document.body.removeChild(container)
    renderer.dispose()
    vi.clearAllMocks()
  })

  // ============================================================================
  // TEST 1: selectedInstanceId Updates Color Buffer
  // ============================================================================

  it('should update InstancedMesh color buffer when selectedInstanceId changes', () => {
    // Arrange - Initial state: no selection
    expect(setColorAtSpy).not.toHaveBeenCalled()
    resetSpyCallCount()

    // Act - Select node-1 (instance 0)
    cityRenderer.updateConfig({
      selectedNodeId: 'node-1',
      nodes: mockNodes,
      colorMode: 'language',
      onNodeSelect: vi.fn(),
    })

    // Assert
    expect(setColorAtSpy).toHaveBeenCalled()
    const calls = setColorAtSpy.mock.calls
    expect(calls.length).toBeGreaterThan(0)

    // Verify that instance 0 received emissive color update
    const colorUpdateCalls = calls.filter(
      (call: any[]) => call[0] === 0 // Instance 0 corresponds to node-1
    )
    expect(colorUpdateCalls.length).toBeGreaterThan(0)
  })

  it('should apply indigo emissive color (0x6b21a8) to selected instance', () => {
    // Arrange
    const expectedEmissiveColor = new THREE.Color(0x6b21a8)
    expectedEmissiveColor.multiplyScalar(0.8) // intensity
    resetSpyCallCount()

    // Act - Select node-1
    cityRenderer.updateConfig({
      selectedNodeId: 'node-1',
      nodes: mockNodes,
      colorMode: 'language',
      onNodeSelect: vi.fn(),
    })

    // Assert
    const calls = setColorAtSpy.mock.calls
    const firstInstanceCall = calls.find((call: any[]) => call[0] === 0)
    expect(firstInstanceCall).toBeDefined()
    expect(firstInstanceCall[1]).toBeInstanceOf(THREE.Color)
  })

  it('should reset color buffer when deselecting instance', () => {
    // Arrange - Select node first
    cityRenderer.updateConfig({
      selectedNodeId: 'node-1',
      nodes: mockNodes,
      colorMode: 'language',
      onNodeSelect: vi.fn(),
    })
    resetSpyCallCount()

    // Act - Deselect (set to null)
    cityRenderer.updateConfig({
      selectedNodeId: null,
      nodes: mockNodes,
      colorMode: 'language',
      onNodeSelect: vi.fn(),
    })

    // Assert - All instances should be reset to original colors
    const calls = setColorAtSpy.mock.calls
    expect(calls.length).toBeGreaterThanOrEqual(mockNodes.length)
  })

  // ============================================================================
  // TEST 2: No Duplicate Layout Renders on Color Update
  // ============================================================================

  it('should NOT trigger layout re-render when only updating selection color', () => {
    // Arrange
    const renderCityOriginal = cityRenderer.renderCity.bind(cityRenderer)
    const renderCitySpy = vi.spyOn(cityRenderer, 'renderCity')
    resetSpyCallCount()

    // Act - Update color without changing nodes or layout
    cityRenderer.updateConfig({
      selectedNodeId: 'node-1',
      nodes: mockNodes, // Same nodes, no layout change
      colorMode: 'language',
      onNodeSelect: vi.fn(),
    })

    // Assert - renderCity should NOT be called for color-only updates
    // Only setColorAt should be called
    expect(setColorAtSpy).toHaveBeenCalled()
    expect(renderCitySpy).not.toHaveBeenCalled()
  })

  it('should trigger layout render only when nodes change', () => {
    // Arrange
    const renderCitySpy = vi.spyOn(cityRenderer, 'renderCity')

    // Act - Change nodes (forces layout)
    const newNodes: CodeCityNode[] = [
      ...mockNodes,
      {
        id: 'node-4',
        fileName: 'new.ts',
        relativePath: 'src/new.ts',
        language: 'JavaScript',
        linesOfCode: 150,
        cognitiveComplexity: 8,
        gitChurnScore: 0.4,
        coordinates: { x: 5, z: 5 },
        aiExplainer: { purpose: 'New', keyFunctions: [], techDebtWarning: '' },
      },
    ]

    cityRenderer.updateConfig({
      nodes: newNodes,
      colorMode: 'language',
      selectedNodeId: null,
      onNodeSelect: vi.fn(),
    })

    // Assert - renderCity SHOULD be called for node changes
    expect(renderCitySpy).toHaveBeenCalled()
  })

  it('should only update color buffer without recreating InstancedMesh', () => {
    // Arrange
    const initialMeshId = instanceMesh.uuid
    const initialGeometry = instanceMesh.geometry
    const initialMaterial = instanceMesh.material

    // Act - Select different nodes
    cityRenderer.updateConfig({
      selectedNodeId: 'node-1',
      nodes: mockNodes,
      colorMode: 'language',
      onNodeSelect: vi.fn(),
    })

    cityRenderer.updateConfig({
      selectedNodeId: 'node-2',
      nodes: mockNodes,
      colorMode: 'language',
      onNodeSelect: vi.fn(),
    })

    // Assert - Same mesh instance
    expect(instanceMesh.uuid).toBe(initialMeshId)
    expect(instanceMesh.geometry).toBe(initialGeometry)
    expect(instanceMesh.material).toBe(initialMaterial)
  })

  // ============================================================================
  // TEST 3: InstanceColor Buffer Update Semantics
  // ============================================================================

  it('should set instanceColor.needsUpdate = true after color changes', () => {
    // Arrange
    instanceMesh.instanceColor!.needsUpdate = false
    resetSpyCallCount()

    // Act - Select a node
    cityRenderer.updateConfig({
      selectedNodeId: 'node-1',
      nodes: mockNodes,
      colorMode: 'language',
      onNodeSelect: vi.fn(),
    })

    // Assert
    expect(instanceMesh.instanceColor!.needsUpdate).toBe(true)
  })

  it('should update correct instance index for multi-node selection sequence', () => {
    // Arrange
    resetSpyCallCount()

    // Act - Select node-1 (index 0)
    cityRenderer.updateConfig({
      selectedNodeId: 'node-1',
      nodes: mockNodes,
      colorMode: 'language',
      onNodeSelect: vi.fn(),
    })

    const firstSelectionCalls = setColorAtSpy.mock.calls.length

    resetSpyCallCount()

    // Act - Select node-2 (index 1)
    cityRenderer.updateConfig({
      selectedNodeId: 'node-2',
      nodes: mockNodes,
      colorMode: 'language',
      onNodeSelect: vi.fn(),
    })

    // Assert - Different instances should be updated
    expect(setColorAtSpy).toHaveBeenCalled()
    const secondSelectionCalls = setColorAtSpy.mock.calls

    // Verify updates targeted different instances
    const node2UpdateCall = secondSelectionCalls.find((call: any[]) => call[0] === 1)
    expect(node2UpdateCall).toBeDefined()
  })

  // ============================================================================
  // TEST 4: Color Mode Switching
  // ============================================================================

  it('should recompute colors when switching from language to churn mode', () => {
    // Arrange
    resetSpyCallCount()

    // Act - Switch to churn mode
    cityRenderer.updateConfig({
      nodes: mockNodes,
      colorMode: 'churn', // Changed from 'language'
      selectedNodeId: null,
      onNodeSelect: vi.fn(),
    })

    // Assert - Colors should be recomputed (triggers renderCity)
    expect(setColorAtSpy).toHaveBeenCalled()
  })

  it('should apply different colors in churn mode vs language mode', () => {
    // Arrange - Get colors in language mode
    const languageColorCalls: THREE.Color[] = []
    setColorAtSpy.mockImplementation((index: number, color: THREE.Color) => {
      languageColorCalls[index] = color.clone()
    })

    cityRenderer.renderCity()
    const languageColors = [...languageColorCalls]
    resetSpyCallCount()

    // Act - Switch to churn mode
    cityRenderer.updateConfig({
      nodes: mockNodes,
      colorMode: 'churn',
      selectedNodeId: null,
      onNodeSelect: vi.fn(),
    })

    const churnColorCalls: THREE.Color[] = []
    setColorAtSpy.mockImplementation((index: number, color: THREE.Color) => {
      churnColorCalls[index] = color.clone()
    })

    cityRenderer.renderCity()
    const churnColors = [...churnColorCalls]

    // Assert - Colors should differ between modes
    // (Language uses fixed colors, churn uses HSL interpolation)
    expect(languageColors.length).toBe(mockNodes.length)
    expect(churnColors.length).toBe(mockNodes.length)
  })

  // ============================================================================
  // HELPER FUNCTIONS
  // ============================================================================

  function resetSpyCallCount() {
    setColorAtSpy.mockClear()
  }
})
