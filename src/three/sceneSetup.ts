import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

export const createRenderer = (container: HTMLDivElement): THREE.WebGLRenderer => {
  const width = container.clientWidth
  const height = container.clientHeight

  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
    powerPreference: 'high-performance',
    precision: 'highp',
  })

  renderer.setSize(width, height)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFShadowShadowMap
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.0

  container.appendChild(renderer.domElement)
  return renderer
}

export const createScene = (backgroundColor: string): THREE.Scene => {
  const scene = new THREE.Scene()
  scene.background = new THREE.Color(backgroundColor)
  scene.fog = new THREE.Fog(backgroundColor, 100, 200)
  return scene
}

export const createCamera = (aspect: number): THREE.PerspectiveCamera => {
  const camera = new THREE.PerspectiveCamera(
    75,
    aspect,
    0.1,
    1000
  )

  camera.position.set(30, 25, 30)
  camera.lookAt(0, 0, 0)

  return camera
}

export const createControls = (
  camera: THREE.Camera,
  canvas: HTMLCanvasElement
): OrbitControls => {
  const controls = new OrbitControls(camera, canvas)
  controls.enableDamping = true
  controls.dampingFactor = 0.05
  controls.autoRotate = false
  controls.maxDistance = 150
  controls.minDistance = 5
  controls.target.set(0, 5, 0)
  controls.update()

  return controls
}

export const createLights = (scene: THREE.Scene): void => {
  // Main directional light (sun)
  const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2)
  directionalLight.position.set(40, 50, 30)
  directionalLight.castShadow = true
  directionalLight.shadow.mapSize.width = 2048
  directionalLight.shadow.mapSize.height = 2048
  directionalLight.shadow.camera.far = 200
  directionalLight.shadow.camera.left = -100
  directionalLight.shadow.camera.right = 100
  directionalLight.shadow.camera.top = 100
  directionalLight.shadow.camera.bottom = -100
  directionalLight.shadow.bias = -0.0001

  scene.add(directionalLight)

  // Ambient light for overall illumination
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
  scene.add(ambientLight)

  // Fill light to soften shadows
  const fillLight = new THREE.DirectionalLight(0xffffff, 0.4)
  fillLight.position.set(-30, 20, -50)
  scene.add(fillLight)

  // Skylight simulation
  const skyLight = new THREE.HemisphereLight(0x87ceeb, 0x2d5016, 0.5)
  scene.add(skyLight)
}

export const createGroundGrid = (scene: THREE.Scene, gridSizeX: number, gridSizeZ: number): void => {
  const gridHelper = new THREE.GridHelper(Math.max(gridSizeX, gridSizeZ) * 2, 50, 0x444444, 0x222222)
  gridHelper.position.y = -0.01
  scene.add(gridHelper)

  // Ground plane for shadow receiving
  const groundGeometry = new THREE.PlaneGeometry(gridSizeX * 4, gridSizeZ * 4)
  const groundMaterial = new THREE.ShadowMaterial({ opacity: 0.2 })
  const groundMesh = new THREE.Mesh(groundGeometry, groundMaterial)
  groundMesh.rotation.x = -Math.PI / 2
  groundMesh.receiveShadow = true
  scene.add(groundMesh)
}
