import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

export const createRenderer = (container: HTMLElement): THREE.WebGLRenderer => {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false })
  renderer.setPixelRatio(window.devicePixelRatio)
  renderer.setSize(container.clientWidth, container.clientHeight)
  renderer.outputColorSpace = THREE.SRGBColorSpace
  container.appendChild(renderer.domElement)
  return renderer
}

export const createScene = (bgColor: string): THREE.Scene => {
  const scene = new THREE.Scene()
  scene.background = new THREE.Color(bgColor)
  scene.fog = new THREE.Fog(bgColor, 100, 200)
  return scene
}

export const createCamera = (
  aspect: number,
  position = { x: 30, y: 25, z: 30 }
): THREE.PerspectiveCamera => {
  const camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 1000)
  camera.position.set(position.x, position.y, position.z)
  camera.lookAt(0, 0, 0)
  return camera
}

export const createControls = (
  camera: THREE.PerspectiveCamera,
  domElement: HTMLElement
): OrbitControls => {
  const controls = new OrbitControls(camera, domElement)
  controls.enableDamping = true
  controls.dampingFactor = 0.05
  controls.autoRotate = false
  controls.target.set(0, 0, 0)
  controls.update()
  return controls
}

export const createLights = (scene: THREE.Scene): void => {
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
  scene.add(ambientLight)

  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.7)
  directionalLight.position.set(40, 60, 40)
  directionalLight.castShadow = true
  directionalLight.shadow.mapSize.width = 2048
  directionalLight.shadow.mapSize.height = 2048
  directionalLight.shadow.camera.far = 200
  directionalLight.shadow.camera.left = -100
  directionalLight.shadow.camera.right = 100
  directionalLight.shadow.camera.top = 100
  directionalLight.shadow.camera.bottom = -100
  scene.add(directionalLight)
}

export const createGroundGrid = (scene: THREE.Scene, gridSizeX: number, gridSizeZ: number): void => {
  const size = Math.max(gridSizeX, gridSizeZ) * 2
  const divisions = 20
  const gridHelper = new THREE.GridHelper(size, divisions, 0x444466, 0x222233)
  gridHelper.position.y = -0.1
  scene.add(gridHelper)
}
