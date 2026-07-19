import * as THREE from 'three'
import { CodeCityNode, CodeCityEdge } from '@/types/repoAnalysis'

export interface CityRenderConfig {
  nodes: CodeCityNode[]
  colorMode: 'language' | 'churn'
  selectedNodeId: string | null
  onNodeSelect: (nodeId: string | null) => void
}

export class CityRenderer {
  private scene: THREE.Scene
  private camera: THREE.PerspectiveCamera
  private renderer: THREE.WebGLRenderer
  private instancedMesh: THREE.InstancedMesh | null = null
  private nodeMap: Map<number, CodeCityNode> = new Map()
  private raycaster: THREE.Raycaster
  private mouse: THREE.Vector2
  private selectedInstanceId: number | null = null
  private config: CityRenderConfig

  constructor(
    container: HTMLDivElement,
    config: CityRenderConfig,
    scene: THREE.Scene,
    camera: THREE.PerspectiveCamera,
    renderer: THREE.WebGLRenderer
  ) {
    this.scene = scene
    this.camera = camera
    this.renderer = renderer
    this.config = config
    this.raycaster = new THREE.Raycaster()
    this.mouse = new THREE.Vector2()
    this.setupMouseListeners(container)
  }

  renderCity(): void {
    if (this.instancedMesh) {
      this.scene.remove(this.instancedMesh)
      this.instancedMesh.geometry.dispose()
      ;(this.instancedMesh.material as THREE.Material).dispose()
      this.instancedMesh = null
    }

    this.nodeMap.clear()

    const nodeCount = this.config.nodes.length
    if (nodeCount === 0) return

    // Create base box geometry (1x1x1, will be scaled per instance)
    const geometry = new THREE.BoxGeometry(1, 1, 1)
    const material = new THREE.MeshPhongMaterial({
      shininess: 100,
      emissive: 0x000000,
    })

    // Create instanced mesh with capacity for all nodes
    this.instancedMesh = new THREE.InstancedMesh(geometry, material, nodeCount)
    this.instancedMesh.castShadow = true
    this.instancedMesh.receiveShadow = true

    const matrix = new THREE.Matrix4()

    this.config.nodes.forEach((node, index) => {
      this.nodeMap.set(index, node)

      // Compute dimensions from metrics
      const height = Math.max(0.5, Math.log10(node.linesOfCode) * 3)
      const footprint = Math.max(1.0, Math.sqrt(node.cognitiveComplexity))
      const width = footprint
      const depth = footprint

      // Position: node coordinates at base of building
      const x = node.coordinates.x
      const y = height / 2 // Center height vertically
      const z = node.coordinates.z

      // Build transformation matrix: position + scale
      matrix.compose(
        new THREE.Vector3(x, y, z),
        new THREE.Quaternion(0, 0, 0, 1),
        new THREE.Vector3(width, height, depth)
      )

      // Set this instance's transform
      this.instancedMesh.setMatrixAt(index, matrix)

      // Set color per instance
      const color = this.computeInstanceColor(node)
      this.instancedMesh.setColorAt(index, color)
    })

    this.instancedMesh.instanceMatrix.needsUpdate = true
    if (this.instancedMesh.instanceColor) {
      this.instancedMesh.instanceColor.needsUpdate = true
    }

    this.scene.add(this.instancedMesh)
    this.updateSelection()
  }

  private computeInstanceColor(node: CodeCityNode): THREE.Color {
    if (this.config.colorMode === 'language') {
      const langColors: Record<string, string> = {
        TypeScript: '#3178c6',
        JavaScript: '#f7df1e',
        Python: '#3776ab',
        Go: '#00add8',
        Java: '#007396',
        Rust: '#ce422b',
        'C++': '#00599c',
        'C#': '#239120',
        Kotlin: '#7f52ff',
        Swift: '#fa7343',
        Ruby: '#cc342d',
        PHP: '#777bb4',
      }
      const hex = langColors[node.language] || '#94a3b8'
      return new THREE.Color(hex)
    }

    // Churn mode: green (stable) to red (churned)
    const churn = Math.max(0, Math.min(1, node.gitChurnScore))
    const hue = 120 - churn * 120 // 120 (green) → 0 (red)
    const saturation = 70 + churn * 30
    const lightness = 45 + churn * 5

    return new THREE.Color().setHSL(hue / 360, saturation / 100, lightness / 100)
  }

  private setupMouseListeners(container: HTMLDivElement): void {
    const onMouseMove = (event: MouseEvent) => {
      const rect = container.getBoundingClientRect()
      this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
      this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

      this.raycasterUpdate()
    }

    const onMouseClick = (event: MouseEvent) => {
      const rect = container.getBoundingClientRect()
      this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
      this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

      const intersectedId = this.raycasterPick()
      if (intersectedId !== null) {
        const node = this.nodeMap.get(intersectedId)
        if (node) {
          this.config.onNodeSelect(node.id)
          this.selectedInstanceId = intersectedId
          this.updateSelection()
        }
      } else {
        this.config.onNodeSelect(null)
        this.selectedInstanceId = null
        this.updateSelection()
      }
    }

    container.addEventListener('mousemove', onMouseMove)
    container.addEventListener('click', onMouseClick)

    // Cleanup on unmount (caller responsibility)
    ;(container as any).__cleanup = () => {
      container.removeEventListener('mousemove', onMouseMove)
      container.removeEventListener('click', onMouseClick)
    }
  }

  private raycasterUpdate(): void {
    if (!this.instancedMesh) return

    this.raycaster.setFromCamera(this.mouse, this.camera)
    const intersects = this.raycaster.intersectObject(this.instancedMesh)

    // Highlight on hover
    if (intersects.length > 0) {
      const instanceId = intersects[0].instanceId
      if (instanceId !== undefined && instanceId !== this.selectedInstanceId) {
        this.setInstanceEmissive(instanceId, 0x4c0080, 0.3) // Indigo highlight
      }
    } else if (this.selectedInstanceId === null) {
      // Reset all if nothing selected and no hover
      this.resetAllEmissive()
    }
  }

  private raycasterPick(): number | null {
    if (!this.instancedMesh) return null

    this.raycaster.setFromCamera(this.mouse, this.camera)
    const intersects = this.raycaster.intersectObject(this.instancedMesh)

    if (intersects.length > 0 && intersects[0].instanceId !== undefined) {
      return intersects[0].instanceId
    }

    return null
  }

  private updateSelection(): void {
    this.resetAllEmissive()

    if (this.selectedInstanceId !== null) {
      this.setInstanceEmissive(this.selectedInstanceId, 0x6b21a8, 0.8) // Deep indigo glow
    }
  }

  private setInstanceEmissive(instanceId: number, color: number, intensity: number): void {
    if (!this.instancedMesh) return

    const emissiveColor = new THREE.Color(color)
    emissiveColor.multiplyScalar(intensity)

    this.instancedMesh.setColorAt(instanceId, emissiveColor)
    if (this.instancedMesh.instanceColor) {
      this.instancedMesh.instanceColor.needsUpdate = true
    }
  }

  private resetAllEmissive(): void {
    if (!this.instancedMesh) return

    this.config.nodes.forEach((node, index) => {
      const color = this.computeInstanceColor(node)
      this.instancedMesh!.setColorAt(index, color)
    })

    if (this.instancedMesh.instanceColor) {
      this.instancedMesh.instanceColor.needsUpdate = true
    }
  }

  updateConfig(newConfig: Partial<CityRenderConfig>): void {
    this.config = { ...this.config, ...newConfig }

    if (newConfig.colorMode || newConfig.nodes) {
      this.renderCity()
    } else if (newConfig.selectedNodeId !== undefined) {
      const selectedNode = this.config.nodes.find((n) => n.id === newConfig.selectedNodeId)
      if (selectedNode) {
        const instanceId = Array.from(this.nodeMap.values()).indexOf(selectedNode)
        this.selectedInstanceId = instanceId >= 0 ? instanceId : null
      } else {
        this.selectedInstanceId = null
      }
      this.updateSelection()
    }
  }

  dispose(): void {
    if (this.instancedMesh) {
      this.instancedMesh.geometry.dispose()
      ;(this.instancedMesh.material as THREE.Material).dispose()
      this.scene.remove(this.instancedMesh)
    }
  }
}
