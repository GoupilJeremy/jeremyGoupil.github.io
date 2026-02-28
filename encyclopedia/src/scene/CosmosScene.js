import * as THREE from 'three'
import { gsap } from 'gsap'
import { yearToT } from '../data/loader.js'

/**
 * Color map by category
 */
export const CATEGORY_COLORS = {
  cosmologie:    0x64b5f6, // blue
  géologie:      0xa5d6a7, // green
  biologie:      0x80cbc4, // teal
  civilisations: 0xffcc80, // orange
  sciences:      0xce93d8, // purple
  technologies:  0xf48fb1, // pink
}

const DEFAULT_COLOR = 0xffffff

// Camera follows the spiral at this radial distance
const CAM_RADIAL_OFFSET = 16
const CAM_HEIGHT_OFFSET  = 7
const CAM_LOOK_AHEAD     = 0.018 // how far ahead to look along t

/**
 * Builds and manages the spiral timeline scene with event nodes and connection lines.
 */
export class CosmosScene {
  constructor(scene, camera, events) {
    this.scene = scene
    this.camera = camera
    this.events = events
    this.nodes = []       // { mesh, ring, data, baseScale, t }
    this.activeNode = null
    this._lookTarget = new THREE.Vector3()
    this.raycaster = new THREE.Raycaster()
    this._nodeById = new Map()

    this._buildSpiral()
    this._buildNodes()
    this._buildConnectionLines()
    this._buildNebula()
  }

  // ── Spiral path ───────────────────────────────────────────────────────────

  _buildSpiral() {
    const points = []
    const turns = 6
    const totalSamples = 800
    const maxRadius = 90
    const heightSpan = 140

    for (let i = 0; i <= totalSamples; i++) {
      const t = i / totalSamples
      const angle = t * turns * Math.PI * 2
      // Radius grows faster at the end to spread out recent events
      const r = 5 + Math.pow(t, 0.7) * maxRadius
      const y = (t - 0.5) * heightSpan
      points.push(new THREE.Vector3(
        Math.cos(angle) * r,
        y,
        Math.sin(angle) * r,
      ))
    }

    this.spiralCurve = new THREE.CatmullRomCurve3(points)

    const geo = new THREE.TubeGeometry(this.spiralCurve, 800, 0.06, 6, false)
    const mat = new THREE.MeshBasicMaterial({
      color: 0x1a3a5c,
      transparent: true,
      opacity: 0.4,
    })
    this.spiralMesh = new THREE.Mesh(geo, mat)
    this.scene.add(this.spiralMesh)
  }

  // ── Event nodes ───────────────────────────────────────────────────────────

  _buildNodes() {
    this.events.forEach((event) => {
      // Use logarithmic time → t mapping for realistic spacing
      const t = Math.max(0, Math.min(1, yearToT(event.date.year)))
      const pos = this.spiralCurve.getPoint(t)

      const color = CATEGORY_COLORS[event.category] ?? DEFAULT_COLOR
      const impact = event.impact ?? 5
      const baseScale = 0.12 + (impact / 10) * 0.32

      // Outer glow ring
      const ringGeo = new THREE.RingGeometry(baseScale * 1.5, baseScale * 2.0, 32)
      const ringMat = new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0.18,
        side: THREE.DoubleSide,
        depthWrite: false,
      })
      const ring = new THREE.Mesh(ringGeo, ringMat)
      ring.position.copy(pos)
      this.scene.add(ring)

      // Core sphere
      const geo = new THREE.SphereGeometry(baseScale, 16, 16)
      const mat = new THREE.MeshStandardMaterial({
        color,
        emissive: color,
        emissiveIntensity: 0.55,
        metalness: 0.3,
        roughness: 0.35,
      })
      const mesh = new THREE.Mesh(geo, mat)
      mesh.position.copy(pos)
      this.scene.add(mesh)

      const node = { mesh, ring, data: event, baseScale, t, pos: pos.clone() }
      this.nodes.push(node)
      this._nodeById.set(event.id, node)
    })
  }

  // ── Connection lines ──────────────────────────────────────────────────────

  _buildConnectionLines() {
    const linePositions = []

    this.events.forEach(event => {
      const fromNode = this._nodeById.get(event.id)
      if (!fromNode || !event.connections) return

      event.connections.forEach(targetId => {
        const toNode = this._nodeById.get(targetId)
        if (!toNode) return

        // Only draw connection once (from older to newer)
        if (fromNode.t <= toNode.t) {
          linePositions.push(
            fromNode.pos.x, fromNode.pos.y, fromNode.pos.z,
            toNode.pos.x,   toNode.pos.y,   toNode.pos.z,
          )
        }
      })
    })

    if (linePositions.length === 0) return

    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3))

    const mat = new THREE.LineBasicMaterial({
      color: 0x2a5080,
      transparent: true,
      opacity: 0.3,
      depthWrite: false,
    })

    this.connectionLines = new THREE.LineSegments(geo, mat)
    this.scene.add(this.connectionLines)
  }

  // ── Background nebula ─────────────────────────────────────────────────────

  _buildNebula() {
    const count = 2500
    const positions = new Float32Array(count * 3)
    const colors = new Float32Array(count * 3)
    const c = new THREE.Color()

    for (let i = 0; i < count; i++) {
      positions[i * 3]     = (Math.random() - 0.5) * 350
      positions[i * 3 + 1] = (Math.random() - 0.5) * 220
      positions[i * 3 + 2] = (Math.random() - 0.5) * 350 - 100

      const hue = 0.55 + Math.random() * 0.18
      c.setHSL(hue, 0.75, 0.2 + Math.random() * 0.3)
      colors[i * 3]     = c.r
      colors[i * 3 + 1] = c.g
      colors[i * 3 + 2] = c.b
    }

    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))

    const mat = new THREE.PointsMaterial({
      size: 1.4,
      vertexColors: true,
      transparent: true,
      opacity: 0.3,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })

    this.scene.add(new THREE.Points(geo, mat))
  }

  // ── Camera fly-through ────────────────────────────────────────────────────

  /**
   * Smoothly flies camera to a position along the spiral,
   * offset perpendicular to the tangent for a cinematic look.
   */
  navigateTo(t) {
    const tClamped  = Math.max(0.001, Math.min(0.999, t))
    const tAhead    = Math.min(tClamped + CAM_LOOK_AHEAD, 0.999)

    const spiralPt  = this.spiralCurve.getPoint(tClamped)
    const tangent   = this.spiralCurve.getTangent(tClamped).normalize()
    const lookAtPt  = this.spiralCurve.getPoint(tAhead)

    // Build an orthonormal frame at this point
    const up    = new THREE.Vector3(0, 1, 0)
    const right = new THREE.Vector3().crossVectors(tangent, up).normalize()
    const realUp = new THREE.Vector3().crossVectors(right, tangent).normalize()

    // Camera position: pull back along -tangent and offset up and to the right
    const camTarget = spiralPt.clone()
      .addScaledVector(tangent, -CAM_RADIAL_OFFSET * 0.6)
      .addScaledVector(right,    CAM_RADIAL_OFFSET * 0.8)
      .addScaledVector(realUp,   CAM_HEIGHT_OFFSET)

    gsap.to(this.camera.position, {
      x: camTarget.x,
      y: camTarget.y,
      z: camTarget.z,
      duration: 1.4,
      ease: 'power3.inOut',
    })

    gsap.to(this._lookTarget, {
      x: lookAtPt.x,
      y: lookAtPt.y,
      z: lookAtPt.z,
      duration: 1.4,
      ease: 'power3.inOut',
      onUpdate: () => this.camera.lookAt(this._lookTarget),
    })
  }

  // ── Raycasting ────────────────────────────────────────────────────────────

  getHoveredNode(ndcX, ndcY) {
    const mouse = new THREE.Vector2(ndcX, ndcY)
    this.raycaster.setFromCamera(mouse, this.camera)

    const meshes = this.nodes.map(n => n.mesh)
    const hits = this.raycaster.intersectObjects(meshes)
    if (hits.length === 0) return null

    return this.nodes.find(n => n.mesh === hits[0].object) ?? null
  }

  highlightNode(node) {
    if (this.activeNode && this.activeNode !== node) {
      this._resetNode(this.activeNode)
    }
    if (!node) { this.activeNode = null; return }

    gsap.to(node.mesh.scale, { x: 1.8, y: 1.8, z: 1.8, duration: 0.2 })
    gsap.to(node.ring.material, { opacity: 0.65, duration: 0.2 })
    this.activeNode = node
  }

  _resetNode(node) {
    gsap.to(node.mesh.scale, { x: 1, y: 1, z: 1, duration: 0.2 })
    gsap.to(node.ring.material, { opacity: 0.18, duration: 0.2 })
  }

  // ── Per-frame update ──────────────────────────────────────────────────────

  update(elapsedTime) {
    this.nodes.forEach(({ ring, mesh }, i) => {
      ring.lookAt(this.camera.position)
      const pulse = 0.5 + 0.3 * Math.sin(elapsedTime * 1.4 + i * 0.45)
      mesh.material.emissiveIntensity = pulse
    })
  }

  // ── Category filter ───────────────────────────────────────────────────────

  filterByCategory(category) {
    this.nodes.forEach(({ mesh, ring, data }) => {
      const visible = category === 'all' || data.category === category
      mesh.material.transparent = true
      gsap.to(mesh.material, { opacity: visible ? 1 : 0.04, duration: 0.35 })
      gsap.to(ring.material, { opacity: visible ? 0.18 : 0.0, duration: 0.35 })
    })

    // Dim connection lines when filtering
    if (this.connectionLines) {
      gsap.to(this.connectionLines.material, {
        opacity: category === 'all' ? 0.3 : 0.06,
        duration: 0.35,
      })
    }
  }
}
