import * as THREE from 'three'
import { gsap } from 'gsap'
import { ParticleSystem } from './scene/ParticleSystem.js'
import { CosmosScene } from './scene/CosmosScene.js'
import { loadEvents } from './data/loader.js'

// ── DOM refs ────────────────────────────────────────────────────────────────
const container      = document.getElementById('canvas-container')
const loading        = document.getElementById('loading')
const detailPanel    = document.getElementById('detail-panel')
const detailClose    = document.getElementById('detail-close')
const detailCategory = document.getElementById('detail-category')
const detailTitle    = document.getElementById('detail-title')
const detailDate     = document.getElementById('detail-date')
const detailDesc     = document.getElementById('detail-description')
const detailConns    = document.getElementById('detail-connections')
const tooltip        = document.getElementById('tooltip')
const tooltipTitle   = document.getElementById('tooltip-title')
const tooltipDate    = document.getElementById('tooltip-date')
const timelineTrack  = document.getElementById('timeline-track')
const timelineProgress = document.getElementById('timeline-progress')
const timelineCursor = document.getElementById('timeline-cursor')
const currentEra     = document.getElementById('current-era')
const filterBtns     = document.querySelectorAll('.filter-btn')

// ── Era labels (logarithmic breakpoints 0–1) ────────────────────────────────
const ERAS = [
  { t: 0.00, label: 'Big Bang' },
  { t: 0.10, label: 'Premières étoiles' },
  { t: 0.20, label: 'Formation du Système Solaire' },
  { t: 0.30, label: 'Premières cellules' },
  { t: 0.45, label: 'Grande Oxydation' },
  { t: 0.55, label: 'Explosion cambrienne' },
  { t: 0.65, label: 'Conquête des terres' },
  { t: 0.75, label: 'Âge des Dinosaures' },
  { t: 0.85, label: 'Primates & Hominidés' },
  { t: 0.92, label: 'Premières civilisations' },
  { t: 0.96, label: 'Révolution scientifique' },
  { t: 0.99, label: 'Ère numérique' },
  { t: 1.00, label: 'Aujourd\'hui' },
]

// ── Three.js setup ──────────────────────────────────────────────────────────
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false })
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.setClearColor(0x020408, 1)
renderer.outputColorSpace = THREE.SRGBColorSpace
container.appendChild(renderer.domElement)

const scene = new THREE.Scene()

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 2000)
camera.position.set(20, 5, 20)
camera.lookAt(0, 0, 0)

// Ambient + directional light for node spheres
const ambientLight = new THREE.AmbientLight(0xffffff, 0.4)
const dirLight = new THREE.DirectionalLight(0x64b5f6, 1.2)
dirLight.position.set(10, 20, 10)
scene.add(ambientLight, dirLight)

// ── State ───────────────────────────────────────────────────────────────────
let particles = null
let cosmos = null
let events = []
let currentT = 0
let isDraggingTimeline = false
let activeFilter = 'all'
let hoveredNode = null
const clock = new THREE.Clock()

// ── Init ────────────────────────────────────────────────────────────────────
async function init() {
  events = await loadEvents()

  particles = new ParticleSystem(8000, 900)
  particles.addTo(scene)

  cosmos = new CosmosScene(scene, camera, events)

  // Initial camera position at spiral start
  cosmos.navigateTo(0)

  // Hide loading screen
  gsap.to(loading, {
    opacity: 0,
    duration: 0.8,
    delay: 0.3,
    onComplete: () => loading.classList.add('hidden'),
  })

  animate()
}

// ── Animation loop ──────────────────────────────────────────────────────────
function animate() {
  requestAnimationFrame(animate)
  const elapsed = clock.getElapsedTime()

  particles.update(elapsed)
  cosmos.update(elapsed)

  // Slow auto-rotation of the scene
  scene.rotation.y = elapsed * 0.008

  renderer.render(scene, camera)
}

// ── Timeline interaction ─────────────────────────────────────────────────────
function setTimelineT(t) {
  currentT = Math.max(0, Math.min(1, t))
  timelineProgress.style.width = `${currentT * 100}%`
  timelineCursor.style.left = `${currentT * 100}%`

  // Update era label
  const era = [...ERAS].reverse().find(e => currentT >= e.t)
  currentEra.textContent = era ? era.label : ERAS[0].label

  cosmos.navigateTo(currentT)
}

timelineTrack.addEventListener('mousedown', e => {
  isDraggingTimeline = true
  updateTimelineFromEvent(e)
})

document.addEventListener('mousemove', e => {
  if (!isDraggingTimeline) return
  updateTimelineFromEvent(e)
})

document.addEventListener('mouseup', () => { isDraggingTimeline = false })

function updateTimelineFromEvent(e) {
  const rect = timelineTrack.getBoundingClientRect()
  const t = (e.clientX - rect.left) / rect.width
  setTimelineT(t)
}

// Scroll wheel navigation
window.addEventListener('wheel', e => {
  const delta = e.deltaY > 0 ? 0.02 : -0.02
  setTimelineT(currentT + delta)
}, { passive: true })

// ── Raycasting / hover & click ───────────────────────────────────────────────
window.addEventListener('mousemove', e => {
  if (!cosmos) return

  const ndcX = (e.clientX / window.innerWidth) * 2 - 1
  const ndcY = -(e.clientY / window.innerHeight) * 2 + 1

  const node = cosmos.getHoveredNode(ndcX, ndcY)

  if (node !== hoveredNode) {
    hoveredNode = node
    cosmos.highlightNode(node)

    if (node) {
      tooltipTitle.textContent = node.data.title
      tooltipDate.textContent = node.data.date.label
      tooltip.classList.add('visible')
      document.body.style.cursor = 'pointer'
    } else {
      tooltip.classList.remove('visible')
      document.body.style.cursor = 'default'
    }
  }

  if (node) {
    tooltip.style.left = `${e.clientX + 14}px`
    tooltip.style.top  = `${e.clientY - 10}px`
  }
})

window.addEventListener('click', () => {
  if (!hoveredNode) return
  openDetailPanel(hoveredNode.data)
  setTimelineT(hoveredNode.t)
})

// ── Detail panel ─────────────────────────────────────────────────────────────
function openDetailPanel(event) {
  const categoryColors = {
    cosmologie:    '#64b5f6',
    géologie:      '#a5d6a7',
    biologie:      '#80cbc4',
    civilisations: '#ffcc80',
    sciences:      '#ce93d8',
    technologies:  '#f48fb1',
  }

  detailCategory.textContent = event.category.toUpperCase()
  detailCategory.style.color = categoryColors[event.category] ?? '#aaa'
  detailTitle.textContent = event.title
  detailDate.textContent = event.date.label
  detailDesc.textContent = event.description

  detailConns.innerHTML = ''
  if (event.connections?.length) {
    event.connections.forEach(id => {
      const related = events.find(e => e.id === id)
      if (!related) return
      const tag = document.createElement('span')
      tag.className = 'connection-tag'
      tag.textContent = related.title
      tag.addEventListener('click', () => openDetailPanel(related))
      detailConns.appendChild(tag)
    })
  }

  detailPanel.classList.add('visible')
}

detailClose.addEventListener('click', () => {
  detailPanel.classList.remove('visible')
})

// ── Category filters ──────────────────────────────────────────────────────────
filterBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    filterBtns.forEach(b => b.classList.remove('active'))
    btn.classList.add('active')
    activeFilter = btn.dataset.category
    if (cosmos) cosmos.filterByCategory(activeFilter)
  })
})

// ── Resize ───────────────────────────────────────────────────────────────────
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})

// ── Boot ──────────────────────────────────────────────────────────────────────
init()
