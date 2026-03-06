import * as THREE from 'three'
import { gsap } from 'gsap'
import { EVENT_LOCATIONS } from '../data/locations.js'
import { CATEGORY_COLORS } from './CosmosScene.js'

const GLOBE_RADIUS = 5
const MARKER_RADIUS = GLOBE_RADIUS + 0.08

// Continent polygons [lat, lon] — simplified but recognizable outlines
const CONTINENTS = [
  // North America
  [[72,-140],[68,-90],[60,-65],[47,-60],[43,-66],[30,-80],[25,-80],[20,-87],[15,-90],
   [8,-77],[8,-80],[18,-100],[22,-105],[32,-117],[49,-124],[60,-140],[72,-140]],
  // South America
  [[12,-71],[8,-60],[5,-52],[-5,-35],[-23,-43],[-35,-57],[-55,-65],[-56,-68],
   [-42,-73],[-30,-71],[-18,-70],[-5,-78],[0,-78],[8,-77],[12,-71]],
  // Europe
  [[36,-9],[37,30],[42,35],[47,38],[55,30],[60,28],[65,25],[70,25],
   [71,28],[65,16],[58,26],[65,14],[60,5],[55,15],[47,8],[43,6],[37,0],[36,-9]],
  // Africa
  [[37,-5],[37,10],[20,37],[12,44],[11,51],[-1,42],[-11,40],[-35,26],
   [-34,18],[-18,12],[0,8],[5,-5],[15,-17],[37,-5]],
  // Asia (main body)
  [[36,36],[42,40],[42,52],[36,57],[22,57],[12,44],[11,51],[1,42],[1,104],
   [10,104],[22,114],[35,120],[45,135],[55,140],[65,175],[70,168],[75,130],
   [75,80],[72,55],[80,30],[60,30],[55,30],[47,38],[40,34],[36,36]],
  // Japan
  [[35,135],[41,141],[43,144],[35,137],[33,131],[35,135]],
  // Australia
  [[-12,130],[-14,136],[-15,145],[-24,153],[-38,147],[-43,147],
   [-37,140],[-32,115],[-22,114],[-16,123],[-12,130]],
  // Greenland
  [[60,-48],[70,-25],[83,-35],[83,-55],[76,-68],[60,-48]],
  // UK (simplified)
  [[50,-6],[50,2],[58,2],[58,-5],[54,-6],[50,-6]],
  // Iceland
  [[63,-25],[65,-13],[66,-15],[64,-23],[63,-25]],
]

// ── Helpers ────────────────────────────────────────────────────────────────

function latLonToVec3(lat, lon, r = GLOBE_RADIUS) {
  const phi   = (90 - lat) * (Math.PI / 180)
  const theta = (lon + 180) * (Math.PI / 180)
  return new THREE.Vector3(
    -r * Math.sin(phi) * Math.cos(theta),
     r * Math.cos(phi),
     r * Math.sin(phi) * Math.sin(theta),
  )
}

function createEarthTexture() {
  const W = 1024, H = 512
  const canvas = document.createElement('canvas')
  canvas.width = W; canvas.height = H
  const ctx = canvas.getContext('2d')

  // Ocean gradient
  const grad = ctx.createLinearGradient(0, 0, 0, H)
  grad.addColorStop(0,   '#04111f')
  grad.addColorStop(0.5, '#071d33')
  grad.addColorStop(1,   '#04111f')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, W, H)

  // Latitude / longitude grid
  ctx.strokeStyle = 'rgba(100,181,246,0.07)'
  ctx.lineWidth = 0.8
  for (let lat = -90; lat <= 90; lat += 30) {
    const y = (90 - lat) / 180 * H
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke()
  }
  for (let lon = -180; lon <= 180; lon += 30) {
    const x = (lon + 180) / 360 * W
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke()
  }

  // Continents
  function drawContinent(coords) {
    ctx.beginPath()
    coords.forEach(([lat, lon], i) => {
      const x = (lon + 180) / 360 * W
      const y = (90 - lat) / 180 * H
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    })
    ctx.closePath()

    const landGrad = ctx.createLinearGradient(0, 0, 0, H)
    landGrad.addColorStop(0, '#1b3d2a')
    landGrad.addColorStop(0.5, '#204a32')
    landGrad.addColorStop(1, '#1b3d2a')
    ctx.fillStyle = landGrad
    ctx.fill()

    ctx.strokeStyle = 'rgba(100,200,130,0.15)'
    ctx.lineWidth = 0.6
    ctx.stroke()
  }

  CONTINENTS.forEach(drawContinent)

  // Ice caps
  ctx.fillStyle = 'rgba(200,230,255,0.35)'
  // Arctic
  ctx.fillRect(0, 0, W, 28)
  // Antarctic
  ctx.fillRect(0, H - 22, W, 22)

  return new THREE.CanvasTexture(canvas)
}

// Great-circle arc (slerp path slightly above surface)
function buildArcGeometry(fromVec, toVec, elevation = 0.18, segments = 48) {
  const points = []
  for (let i = 0; i <= segments; i++) {
    const t = i / segments
    const p = new THREE.Vector3().lerpVectors(fromVec, toVec, t).normalize()
    // Elevate midpoints to create an arc above surface
    const arc = Math.sin(t * Math.PI) * elevation
    p.multiplyScalar(GLOBE_RADIUS + 0.04 + arc)
    points.push(p)
  }
  return new THREE.BufferGeometry().setFromPoints(points)
}

// ── GlobeScene ─────────────────────────────────────────────────────────────

export class GlobeScene {
  constructor(scene, camera, events) {
    this.scene = scene
    this.camera = camera
    this.events = events
    this.markers = []
    this._markerById = new Map()
    this.arcLines = []
    this._group = new THREE.Group()
    this.scene.add(this._group)
    this.activeFilter = 'all'
    this._rotationTarget = 0
    this._autoRotate = true

    this._buildGlobe()
    this._buildAtmosphere()
    this._buildMarkers()
    this._buildArcs()
    this.hide() // hidden by default; CosmosScene is shown first
  }

  // ── Globe & atmosphere ──────────────────────────────────────────────

  _buildGlobe() {
    const geo = new THREE.SphereGeometry(GLOBE_RADIUS, 64, 64)
    const mat = new THREE.MeshStandardMaterial({
      map: createEarthTexture(),
      roughness: 0.85,
      metalness: 0.05,
    })
    this._globe = new THREE.Mesh(geo, mat)
    this._group.add(this._globe)
  }

  _buildAtmosphere() {
    // Outer atmosphere glow
    const geo = new THREE.SphereGeometry(GLOBE_RADIUS * 1.06, 32, 32)
    const mat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      uniforms: {},
      vertexShader: /* glsl */`
        varying vec3 vNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: /* glsl */`
        varying vec3 vNormal;
        void main() {
          float fresnel = pow(1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0))), 2.5);
          vec3 color = mix(vec3(0.05, 0.2, 0.5), vec3(0.1, 0.5, 1.0), fresnel);
          gl_FragColor = vec4(color, fresnel * 0.7);
        }
      `,
    })
    this._group.add(new THREE.Mesh(geo, mat))
  }

  // ── Event markers ───────────────────────────────────────────────────

  _buildMarkers() {
    this.events.forEach(event => {
      const loc = EVENT_LOCATIONS[event.id]
      if (!loc) return

      const color  = CATEGORY_COLORS[event.category] ?? 0xffffff
      const impact = event.impact ?? 5
      const r      = 0.07 + (impact / 10) * 0.09

      const pos = latLonToVec3(loc.lat, loc.lon, MARKER_RADIUS)

      // Pulse ring
      const ringGeo = new THREE.RingGeometry(r * 1.5, r * 2.2, 24)
      const ringMat = new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0.22,
        side: THREE.DoubleSide,
        depthWrite: false,
      })
      const ring = new THREE.Mesh(ringGeo, ringMat)
      ring.position.copy(pos)
      ring.lookAt(pos.clone().multiplyScalar(2))
      this._group.add(ring)

      // Dot
      const geo = new THREE.SphereGeometry(r, 10, 10)
      const mat = new THREE.MeshStandardMaterial({
        color, emissive: color, emissiveIntensity: 0.7,
        roughness: 0.3, metalness: 0.2,
      })
      const mesh = new THREE.Mesh(geo, mat)
      mesh.position.copy(pos)
      this._group.add(mesh)

      const marker = { mesh, ring, data: event, loc, pos: pos.clone() }
      this.markers.push(marker)
      this._markerById.set(event.id, marker)
    })
  }

  // ── Connection arcs ─────────────────────────────────────────────────

  _buildArcs() {
    const drawn = new Set()

    this.events.forEach(event => {
      const fromLoc = EVENT_LOCATIONS[event.id]
      if (!fromLoc || !event.connections) return

      event.connections.forEach(targetId => {
        const toLoc = EVENT_LOCATIONS[targetId]
        if (!toLoc) return

        const key = [event.id, targetId].sort().join('→')
        if (drawn.has(key)) return
        drawn.add(key)

        const fromVec = latLonToVec3(fromLoc.lat, fromLoc.lon)
        const toVec   = latLonToVec3(toLoc.lat, toLoc.lon)

        const dist = fromVec.distanceTo(toVec)
        const elevation = 0.1 + dist * 0.08

        const geo = buildArcGeometry(fromVec, toVec, elevation)
        const mat = new THREE.LineBasicMaterial({
          color: 0x2a6090,
          transparent: true,
          opacity: 0.25,
          depthWrite: false,
        })
        const line = new THREE.Line(geo, mat)
        this._group.add(line)
        this.arcLines.push(line)
      })
    })
  }

  // ── Camera ──────────────────────────────────────────────────────────

  _positionCamera() {
    gsap.to(this.camera.position, {
      x: 0, y: 1, z: 11,
      duration: 1.4,
      ease: 'power3.inOut',
      onUpdate: () => this.camera.lookAt(0, 0, 0),
    })
  }

  /**
   * Rotate globe to bring a lat/lon location into center view.
   */
  focusOnLocation(lat, lon) {
    const targetY = -(lon + 180) * (Math.PI / 180) + Math.PI
    const targetX = (lat * Math.PI) / 180 * 0.3

    gsap.to(this._group.rotation, {
      y: targetY,
      x: targetX,
      duration: 1.2,
      ease: 'power2.inOut',
    })
    this._autoRotate = false
    setTimeout(() => { this._autoRotate = true }, 3000)
  }

  // ── Raycasting ──────────────────────────────────────────────────────

  getHoveredMarker(ndcX, ndcY, camera) {
    const raycaster = new THREE.Raycaster()
    raycaster.setFromCamera(new THREE.Vector2(ndcX, ndcY), camera)
    const meshes = this.markers.map(m => m.mesh)
    const hits = raycaster.intersectObjects(meshes)
    if (!hits.length) return null
    return this.markers.find(m => m.mesh === hits[0].object) ?? null
  }

  highlightMarker(marker) {
    if (this._activeMarker && this._activeMarker !== marker) {
      gsap.to(this._activeMarker.mesh.scale, { x: 1, y: 1, z: 1, duration: 0.2 })
      gsap.to(this._activeMarker.ring.material, { opacity: 0.22, duration: 0.2 })
    }
    if (!marker) { this._activeMarker = null; return }
    gsap.to(marker.mesh.scale, { x: 2, y: 2, z: 2, duration: 0.2 })
    gsap.to(marker.ring.material, { opacity: 0.7, duration: 0.2 })
    this._activeMarker = marker
  }

  // ── Visibility ──────────────────────────────────────────────────────

  show() {
    this._group.visible = true
    this._positionCamera()
  }

  hide() {
    this._group.visible = false
  }

  // ── Filter ──────────────────────────────────────────────────────────

  filterByCategory(category) {
    this.activeFilter = category
    this.markers.forEach(({ mesh, ring, data }) => {
      const visible = category === 'all' || data.category === category
      mesh.material.transparent = true
      gsap.to(mesh.material, { opacity: visible ? 1 : 0.04, duration: 0.35 })
      gsap.to(ring.material, { opacity: visible ? 0.22 : 0.0, duration: 0.35 })
    })
    this.arcLines.forEach(l => {
      gsap.to(l.material, { opacity: category === 'all' ? 0.25 : 0.04, duration: 0.35 })
    })
  }

  // ── Per-frame update ────────────────────────────────────────────────

  update(elapsedTime) {
    if (!this._group.visible) return

    if (this._autoRotate) {
      this._group.rotation.y += 0.0015
    }

    // Pulse markers
    this.markers.forEach(({ ring, mesh }, i) => {
      ring.lookAt(this.camera.position)
      mesh.material.emissiveIntensity = 0.5 + 0.3 * Math.sin(elapsedTime * 1.6 + i * 0.5)
    })
  }
}
