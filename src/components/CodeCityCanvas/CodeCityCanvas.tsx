import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { useCodeCityStore } from '@/store/useCodeCityStore'
import { CityRenderer } from '@/three/cityRenderer'
import { createRenderer, createScene, createCamera, createControls, createLights, createGroundGrid } from '@/three/sceneSetup'
import { buildLaserLines } from '@/three/laserConnections'
import { tweenCameraTo } from '@/three/cameraTween'
import { getPalette } from '@/utils/palette'
import styles from './CodeCityCanvas.module.css'

export const CodeCityCanvas = ({ theme }: { theme: 'dark' | 'light' }) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const controlsRef = useRef<OrbitControls | null>(null)
  const cityRendererRef = useRef<CityRenderer | null>(null)
  const laserGroupRef = useRef<THREE.Group | null>(null)
  const tweenCancelRef = useRef<(() => void) | null>(null)
  const resizeObserverRef = useRef<ResizeObserver | null>(null)
  const rafsRef = useRef<number[]>([])

  const { repoAnalysis, selectedNodeId, cameraFocusRequest, colorMode, selectNode } = useCodeCityStore()
  const palette = getPalette(theme)

  // Initialize Three.js scene and renderer
  useEffect(() => {
    if (!containerRef.current) return

    const container = containerRef.current
    const renderer = createRenderer(container)
    const scene = createScene(palette.bg.base)
    const camera = createCamera(container.clientWidth / container.clientHeight)
    const controls = createControls(camera, renderer.domElement)

    rendererRef.current = renderer
    sceneRef.current = scene
    cameraRef.current = camera
    controlsRef.current = controls

    createLights(scene)
    createGroundGrid(scene, 50, 50)

    // Setup resize observer
    const resizeObserver = new ResizeObserver(() => {
      const width = container.clientWidth
      const height = container.clientHeight
      renderer.setSize(width, height)
      camera.aspect = width / height
      camera.updateProjectionMatrix()
    })
    resizeObserver.observe(container)
    resizeObserverRef.current = resizeObserver

    // Animation loop
    const animate = () => {
      const raf = requestAnimationFrame(animate)
      rafsRef.current.push(raf)
      controls.update()
      renderer.render(scene, camera)
    }
    animate()

    return () => {
      resizeObserver.disconnect()
      rafsRef.current.forEach((raf) => cancelAnimationFrame(raf))
      rafsRef.current = []
      renderer.dispose()
      if (container.parentNode?.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement)
      }
    }
  }, [palette])

  // Render city using InstancedMesh
  useEffect(() => {
    if (!sceneRef.current || !cameraRef.current || !repoAnalysis) return

    // Clean up old laser group
    const oldLaserGroup = laserGroupRef.current
    if (oldLaserGroup) {
      sceneRef.current.remove(oldLaserGroup)
      oldLaserGroup.traverse((child) => {
        if (child instanceof THREE.Line) {
          child.geometry.dispose()
          ;(child.material as THREE.Material).dispose()
        }
      })
    }

    // Render city with InstancedMesh
    if (!cityRendererRef.current) {
      cityRendererRef.current = new CityRenderer(
        containerRef.current!,
        {
          nodes: repoAnalysis.nodes,
          colorMode,
          selectedNodeId,
          onNodeSelect: selectNode,
        },
        sceneRef.current,
        cameraRef.current,
        rendererRef.current!
      )
    } else {
      cityRendererRef.current.updateConfig({
        nodes: repoAnalysis.nodes,
        colorMode,
        selectedNodeId,
        onNodeSelect: selectNode,
      })
    }

    cityRendererRef.current.renderCity()

    // Build laser connections for dependencies
    const newLaserGroup = buildLaserLines(
      repoAnalysis.nodes,
      repoAnalysis.edges,
      selectedNodeId,
      palette.accent.primary
    )
    laserGroupRef.current = newLaserGroup
    sceneRef.current.add(newLaserGroup)
  }, [repoAnalysis, colorMode, selectedNodeId, selectNode, palette])

  // Handle camera focus on node selection
  useEffect(() => {
    if (!cameraFocusRequest || !cameraRef.current || !sceneRef.current) return

    const targetNode = repoAnalysis?.nodes.find((n) => n.id === cameraFocusRequest.nodeId)
    if (!targetNode) return

    if (tweenCancelRef.current) {
      tweenCancelRef.current()
    }

    const targetPos = new THREE.Vector3(
      targetNode.coordinates.x,
      Math.max(0.5, Math.log10(targetNode.linesOfCode) * 3) + 8,
      targetNode.coordinates.z + 8
    )

    tweenCancelRef.current = tweenCameraTo(cameraRef.current, targetPos, 800)
  }, [cameraFocusRequest, repoAnalysis])

  return (
    <div className={styles.container} ref={containerRef} />
  )
}
