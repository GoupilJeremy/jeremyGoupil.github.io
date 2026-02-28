import * as THREE from 'three'
import { gsap } from 'gsap'

/**
 * Color map by category
 */
const CATEGORY_COLORS = {
  cosmologie:    0x64b5f6, // blue
  géologie:      0xa5d6a7, // green
  biologie:      0x80cbc4, // teal
  civilisations: 0xffcc80, // orange
  sciences:      0xce93d8, // purple
  technologies:  0xf48fb1, // pink
}

const DEFAULT_COLOR = 0xffffff

/**
 * Builds and manages the spiral timeline scene with event nodes.
 */
export class CosmosScene {
  constructor(scene, camera, events) {
    this.scene = scene
    this.camera = camera
    this.events = events
    this.nodes = []       // { mesh, data, baseScale }
    this.activeNode = null
    this.raycaster = new THREE.Raycaster()
    this.raycaster.params.Points.threshold = 0.1

    this._buildSpiral()
    this._buildNodes()
    this._buildNebula()
  }

  // ── Spiral path ──────────────────────────────────────────────────────────

  _buildSpiral() {
    const points = []
    const turns = 5
    const totalPoints = 600
    const spread = 80
    const heightSpan = 120

    for (let i = 0; i <= totalPoints; i++) {
      const t = i / totalPoints
      const angle = t * turns * Math.PI * 2
      const r = 6 + t * spread
      const y = (t - 0.5) * heightSpan
      points.push(new THREE.Vector3(
        Math.cos(angle) * r,
        y,
        Math.sin(angle) * r,
      ))
    }

    this.spiralCurve = new THREE.CatmullRomCurve3(points)

    const geometry = new THREE.TubeGeometry(this.spiralCurve, 600, 0.08, 6, false)
    const material = new THREE.MeshBasicMaterial({
      color: 0x1a3a5c,
      transparent: true,
      opacity: 0.45,
    })
    this.spiralMesh = new THREE.Mesh(geometry, material)
    this.scene.add(this.spiralMesh)
  }

  // ── Event nodes ──────────────────────────────────────────────────────────

  _buildNodes() {
    const total = this.events.length

    this.events.forEach((event, index) => {
      const t = index / (total - 1)
      const pos = this.spiralCurve.getPoint(t)

      const color = CATEGORY_COLORS[event.category] ?? DEFAULT_COLOR
      const impact = event.impact ?? 5
      const baseScale = 0.15 + (impact / 10) * 0.35

      // Outer glow ring
      const ringGeo = new THREE.RingGeometry(baseScale * 1.4, baseScale * 1.8, 32)
      const ringMat = new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0.2,
        side: THREE.DoubleSide,
        depthWrite: false,
      })
      const ring = new THREE.Mesh(ringGeo, ringMat)
      ring.position.copy(pos)
      ring.lookAt(this.camera.position)
      this.scene.add(ring)

      // Core sphere
      const geo = new THREE.SphereGeometry(baseScale, 16, 16)
      const mat = new THREE.MeshStandardMaterial({
        color,
        emissive: color,
        emissiveIntensity: 0.6,
        metalness: 0.2,
        roughness: 0.4,
      })
      const mesh = new THREE.Mesh(geo, mat)
      mesh.position.copy(pos)
      mesh.userData = { event, ring, index, t }
      this.scene.add(mesh)

      this.nodes.push({ mesh, ring, data: event, baseScale, t })
    })
  }

  // ── Background nebula ────────────────────────────────────────────────────

  _buildNebula() {
    const count = 2000
    const positions = new Float32Array(count * 3)
    const colors = new Float32Array(count * 3)
    const c = new THREE.Color()

    for (let i = 0; i < count; i++) {
      positions[i * 3]     = (Math.random() - 0.5) * 300
      positions[i * 3 + 1] = (Math.random() - 0.5) * 200
      positions[i * 3 + 2] = (Math.random() - 0.5) * 300 - 80

      const hue = 0.55 + Math.random() * 0.15
      c.setHSL(hue, 0.8, 0.25 + Math.random() * 0.25)
      colors[i * 3]     = c.r
      colors[i * 3 + 1] = c.g
      colors[i * 3 + 2] = c.b
    }

    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))

    const mat = new THREE.PointsMaterial({
      size: 1.2,
      vertexColors: true,
      transparent: true,
      opacity: 0.35,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })

    this.scene.add(new THREE.Points(geo, mat))
  }

  // ── Camera navigation ────────────────────────────────────────────────────

  /**
   * Move camera to look at a given progress value (0–1) along the spiral.
   */
  navigateTo(t) {
    const target = this.spiralCurve.getPoint(t)
    const lookAhead = this.spiralCurve.getPoint(Math.min(t + 0.015, 1))

    gsap.to(this.camera.position, {
      x: target.x + 18,
      y: target.y + 8,
      z: target.z + 18,
      duration: 1.2,
      ease: 'power2.inOut',
    })

    gsap.to(this._lookTarget, {
      x: lookAhead.x,
      y: lookAhead.y,
      z: lookAhead.z,
      duration: 1.2,
      ease: 'power2.inOut',
      onUpdate: () => this.camera.lookAt(this._lookTarget),
    })
  }

  // ── Raycasting / interaction ──────────────────────────────────────────────

  getHoveredNode(ndcX, ndcY) {
    const mouse = new THREE.Vector2(ndcX, ndcY)
    this.raycaster.setFromCamera(mouse, this.camera)

    const meshes = this.nodes.map(n => n.mesh)
    const hits = this.raycaster.intersectObjects(meshes)
    if (hits.length === 0) return null

    const hit = hits[0]
    return this.nodes.find(n => n.mesh === hit.object) ?? null
  }

  highlightNode(node) {
    if (this.activeNode && this.activeNode !== node) {
      this._resetNode(this.activeNode)
    }
    if (!node) { this.activeNode = null; return }

    gsap.to(node.mesh.scale, { x: 1.6, y: 1.6, z: 1.6, duration: 0.25 })
    gsap.to(node.ring.material, { opacity: 0.6, duration: 0.25 })
    this.activeNode = node
  }

  _resetNode(node) {
    gsap.to(node.mesh.scale, { x: 1, y: 1, z: 1, duration: 0.25 })
    gsap.to(node.ring.material, { opacity: 0.2, duration: 0.25 })
  }

  // ── Per-frame update ──────────────────────────────────────────────────────

  update(elapsedTime) {
    // Slowly rotate rings to face camera & pulse glow
    this.nodes.forEach(({ ring, mesh }, i) => {
      ring.lookAt(this.camera.position)
      const pulse = 0.55 + 0.25 * Math.sin(elapsedTime * 1.5 + i * 0.4)
      mesh.material.emissiveIntensity = pulse
    })
  }

  // Internal look-at target for smooth camera
  _lookTarget = new THREE.Vector3()

  /**
   * Filter nodes visibility by category.
   * @param {string} category - 'all' or a specific category key
   */
  filterByCategory(category) {
    this.nodes.forEach(({ mesh, ring, data }) => {
      const visible = category === 'all' || data.category === category
      gsap.to(mesh.material, { opacity: visible ? 1 : 0.05, duration: 0.4 })
      gsap.to(ring.material, { opacity: visible ? 0.2 : 0.0, duration: 0.4 })
      mesh.material.transparent = true
    })
  }
}
