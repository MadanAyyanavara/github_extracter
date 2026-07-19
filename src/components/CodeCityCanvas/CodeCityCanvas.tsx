import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { useCodeCityStore } from '@/store/useCodeCityStore'
import { createRenderer, createScene, createCamera, createControls, createLights, createGroundGrid } from '@/three/sceneSetup'
import { buildCityMeshes } from '@/three/buildCityScene'
import { buildLaserLines } from '@/three/laserConnections'
import { pickNodeAtPointer } from '@/three/raycastSelection'
import { tweenCameraTo } from '@/three/cameraTween'
import { computeFallbackCoordinates } from '@/layout/topologicalLayout'
import { getPalette } from '@/utils/palette'
import styles from './CodeCityCanvas.module.css'

export const CodeCityCanvas = ({ theme }: { theme: 'dark' | 'light' }) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const controlsRef = useRef<OrbitControls | null>(null)
  const cityGroupRef = useRef<THREE.Group | null>(null)
  const laserGroupRef = useRef<THREE.Group | null>(null)
  const meshesByIdRef = useRef<Map<string, THREE.Mesh>>(new Map())
  const tweenCancelRef = useRef<(() => void) | null>(null)
  const resizeObserverRef = useRef<ResizeObserver | null>(null)

  const { repoAnalysis, selectedNodeId, cameraFocusRequest, colorMode, selectNode } = useCodeCityStore()
  const palette = getPalette(theme)

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

    const handlePointerDown = (event: PointerEvent) => {
      const nodeId = pickNodeAtPointer(event, renderer.domElement, camera, meshesByIdRef.current)
      if (nodeId) {
        selectNode(nodeId)
      }
    }

    renderer.domElement.addEventListener('pointerdown', handlePointerDown)

    const resizeObserver = new ResizeObserver(() => {
      const width = container.clientWidth
      const height = container.clientHeight
      renderer.setSize(width, height)
      camera.aspect = width / height
      camera.updateProjectionMatrix()
    })
    resizeObserver.observe(container)
    resizeObserverRef.current = resizeObserver

    const rafs: number[] = []
    const animate = () => {
      const raf = requestAnimationFrame(animate)
      rafs.push(raf)
      controls.update()
      renderer.render(scene, camera)
    }
    animate()

    return () => {
      renderer.domElement.removeEventListener('pointerdown', handlePointerDown)
      resizeObserver.disconnect()
      rafs.forEach((raf) => cancelAnimationFrame(raf))
      renderer.dispose()
      container.removeChild(renderer.domElement)
    }
  }, [selectNode])

  useEffect(() => {
    if (!sceneRef.current || !repoAnalysis) return

    const oldCityGroup = cityGroupRef.current
    if (oldCityGroup) {
      oldCityGroup.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose()
          ;(child.material as THREE.Material).dispose()
        }
      })
      sceneRef.current.remove(oldCityGroup)
    }

    const layoutCoords = new Map(
      repoAnalysis.nodes.map((n) => [
        n.id,
        n.coordinates || { x: 0, z: 0 },
      ])
    )

    if (
      repoAnalysis.nodes.some(
        (n) => !n.coordinates || (n.coordinates.x === 0 && n.coordinates.z === 0)
      )
    ) {
      const fallbackCoords = computeFallbackCoordinates(
        repoAnalysis.nodes,
        repoAnalysis.edges,
        repoAnalysis.visualCanvasConfig.gridSizeX,
        repoAnalysis.visualCanvasConfig.gridSizeZ
      )
      fallbackCoords.forEach((coords, id) => {
        if (!repoAnalysis.nodes.find((n) => n.id === id)?.coordinates) {
          layoutCoords.set(id, coords)
        }
      })
    }

    const { group, meshesById } = buildCityMeshes(repoAnalysis.nodes, layoutCoords, colorMode)
    cityGroupRef.current = group
    meshesByIdRef.current = meshesById
    sceneRef.current.add(group)

    if (!repoAnalysis.nodes.some((n) => n.id === selectedNodeId)) {
      selectNode(null)
    }
  }, [repoAnalysis, colorMode, selectNode, selectedNodeId])

  useEffect(() => {
    const oldLaserGroup = laserGroupRef.current
    if (oldLaserGroup && sceneRef.current) {
      sceneRef.current.remove(oldLaserGroup)
      oldLaserGroup.traverse((child) => {
        if (child instanceof THREE.Line) {
          child.geometry.dispose()
          ;(child.material as THREE.Material).dispose()
        }
      })
    }

    if (selectedNodeId && repoAnalysis) {
      const newLaserGroup = buildLaserLines(selectedNodeId, repoAnalysis.edges, meshesByIdRef.current)
      laserGroupRef.current = newLaserGroup
      sceneRef.current?.add(newLaserGroup)
    }
  }, [selectedNodeId, repoAnalysis, cameraFocusRequest])

  useEffect(() => {
    if (!cameraFocusRequest || !cameraRef.current || !controlsRef.current) return

    const targetMesh = meshesByIdRef.current.get(cameraFocusRequest.nodeId)
    if (!targetMesh) return

    const offset = targetMesh.position.length() + 15
    const direction = targetMesh.position.normalize()
    const targetPos = direction.multiplyScalar(offset)

    if (tweenCancelRef.current) {
      tweenCancelRef.current()
    }

    tweenCancelRef.current = tweenCameraTo(cameraRef.current, controlsRef.current, targetPos, 800)
  }, [cameraFocusRequest?.nonce, cameraFocusRequest])

  useEffect(() => {
    if (sceneRef.current) {
      const bgColor = palette.bg.base
      sceneRef.current.background = new THREE.Color(bgColor)
      sceneRef.current.fog = new THREE.Fog(bgColor, 100, 200)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [palette])

  return <div ref={containerRef} className={styles.canvas} />
}
