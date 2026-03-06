import * as THREE from 'three'
import { gsap } from 'gsap'
import { ParticleSystem }   from './scene/ParticleSystem.js'
import { CosmosScene }      from './scene/CosmosScene.js'
import { GlobeScene }       from './scene/GlobeScene.js'
import { PresentationMode } from './scene/PresentationMode.js'
import { loadEvents }       from './data/loader.js'
import { EVENT_LOCATIONS }  from './data/locations.js'

// ── DOM refs ────────────────────────────────────────────────────────────────
const container      = document.getElementById('canvas-container')
const loading        = document.getElementById('loading')
const loadingDetail  = document.getElementById('loading-detail')
const eventTotal     = document.getElementById('event-total')

const detailPanel    = document.getElementById('detail-panel')
const detailClose    = document.getElementById('detail-close')
const detailCategory = document.getElementById('detail-category')
const detailTitle    = document.getElementById('detail-title')
const detailDate     = document.getElementById('detail-date')
const detailLocation = document.getElementById('detail-location')
const detailDesc     = document.getElementById('detail-description')
const detailConns    = document.getElementById('detail-connections')

const tooltip        = document.getElementById('tooltip')
const tooltipTitle   = document.getElementById('tooltip-title')
const tooltipDate    = document.getElementById('tooltip-date')

const timelineTrack    = document.getElementById('timeline-track')
const timelineProgress = document.getElementById('timeline-progress')
const timelineCursor   = document.getElementById('timeline-cursor')
const currentEra       = document.getElementById('current-era')

const filterBtns    = document.querySelectorAll('.filter-btn')
const viewBtns      = document.querySelectorAll('.view-btn')

const intro         = document.getElementById('intro')
const introCta      = document.getElementById('intro-cta')
const introStatCount = document.getElementById('intro-stat-count')

const btnPlay  = document.getElementById('btn-play')
const btnPrev  = document.getElementById('btn-prev')
const btnNext  = document.getElementById('btn-next')
const btnSpeed = document.getElementById('btn-speed')
const speedLabel   = document.getElementById('speed-label')
const eventCounter = document.getElementById('event-counter')

// ── Era labels ──────────────────────────────────────────────────────────────
const ERAS = [
  { t: 0.00, label: 'Big Bang' },
  { t: 0.05, label: 'Premières étoiles' },
  { t: 0.10, label: 'Formation du Système Solaire' },
  { t: 0.20, label: 'Premières cellules' },
  { t: 0.38, label: 'Grande Oxydation' },
  { t: 0.50, label: 'Explosion cambrienne' },
  { t: 0.57, label: 'Conquête des terres' },
  { t: 0.62, label: 'Âge des Dinosaures' },
  { t: 0.68, label: 'Primates & Hominidés' },
  { t: 0.77, label: 'Premières civilisations' },
  { t: 0.88, label: 'Révolution scientifique' },
  { t: 0.95, label: 'Révolution industrielle' },
  { t: 0.98, label: 'Ère numérique' },
  { t: 1.00, label: 'Intelligence artificielle' },
]

const CATEGORY_COLORS_CSS = {
  cosmologie:    '#64b5f6',
  géologie:      '#a5d6a7',
  biologie:      '#80cbc4',
  civilisations: '#ffcc80',
  sciences:      '#ce93d8',
  technologies:  '#f48fb1',
}

const SPEEDS = [
  { label: '×0.5', ms: 8000 },
  { label: '×1',   ms: 4000 },
  { label: '×2',   ms: 2000 },
  { label: '×4',   ms: 1000 },
]
let speedIndex = 1

// ── Three.js setup ──────────────────────────────────────────────────────────
const renderer = new THREE.WebGLRenderer({ antialias: true })
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.setClearColor(0x020408, 1)
renderer.outputColorSpace = THREE.SRGBColorSpace
container.appendChild(renderer.domElement)

const scene = new THREE.Scene()

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 2000)
camera.position.set(20, 5, 20)
camera.lookAt(0, 0, 0)

scene.add(new THREE.AmbientLight(0xffffff, 0.4))
const dirLight = new THREE.DirectionalLight(0x64b5f6, 1.2)
dirLight.position.set(10, 20, 10)
scene.add(dirLight)

// Globe-specific lights
const globeLight = new THREE.DirectionalLight(0xffffff, 1.6)
globeLight.position.set(8, 4, 12)
scene.add(globeLight)

// ── State ───────────────────────────────────────────────────────────────────
let particles   = null
let cosmos      = null
let globe       = null
let presentation = null
let events      = []
let viewMode    = 'cosmos'   // 'cosmos' | 'globe'
let activeFilter = 'all'
let currentT    = 0
let isDraggingTimeline = false
let hoveredNode = null
const clock = new THREE.Clock()

// ── Init ────────────────────────────────────────────────────────────────────
async function init() {
  loadingDetail.textContent = 'Chargement des données historiques…'
  events = await loadEvents()

  eventTotal.textContent = events.length
  introStatCount.textContent = events.length

  loadingDetail.textContent = 'Génération de la scène 3D…'
  await new Promise(r => setTimeout(r, 60)) // let DOM update

  particles = new ParticleSystem(8000, 900)
  particles.addTo(scene)

  cosmos = new CosmosScene(scene, camera, events)
  globe  = new GlobeScene(scene, camera, events)

  presentation = new PresentationMode(
    events,
    (event, index) => onPresentationStep(event, index),
    () => onPresentationEnd(),
    SPEEDS[speedIndex].ms,
  )

  cosmos.navigateTo(0)

  gsap.to(loading, {
    opacity: 0, duration: 0.8, delay: 0.3,
    onComplete: () => {
      loading.classList.add('hidden')
      showIntro()
    },
  })

  animate()
}

// ── Intro ────────────────────────────────────────────────────────────────────
function showIntro() {
  intro.classList.remove('hidden')

  const tl = gsap.timeline()
  tl.fromTo('#intro-overline',  { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.9 }, 0.1)
  tl.fromTo('#intro-title',     { opacity: 0, y: 22 }, { opacity: 1, y: 0, duration: 1.1 }, 0.5)
  tl.fromTo('#intro-divider',   { opacity: 0, scaleX: 0 }, { opacity: 1, scaleX: 1, duration: 0.7, transformOrigin: 'center' }, 1.2)
  tl.fromTo('#intro-sub',       { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.8 }, 1.5)
  tl.fromTo('#intro-stats',     { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.8 }, 1.9)
  tl.fromTo('#intro-cta',       { opacity: 0, y: 8  }, { opacity: 1, y: 0, duration: 0.7 }, 2.4)

  // Subtle pulsing on CTA after it appears
  tl.to('#intro-cta', {
    boxShadow: '0 0 18px rgba(100,181,246,0.18)',
    duration: 1.4, repeat: -1, yoyo: true, ease: 'sine.inOut',
  }, '+=0.2')
}

introCta.addEventListener('click', () => {
  gsap.killTweensOf('#intro-cta')
  gsap.to(intro, {
    opacity: 0, duration: 1.0, ease: 'power2.inOut',
    onComplete: () => { intro.classList.add('hidden') },
  })
  // Stagger in the UI elements
  const uiEls = [document.getElementById('header'), document.getElementById('filters'), document.getElementById('timeline')]
  uiEls.forEach((el, i) => {
    gsap.delayedCall(0.4 + i * 0.12, () => el.classList.add('ui-visible'))
  })
})

// ── Animation loop ───────────────────────────────────────────────────────────
function animate() {
  requestAnimationFrame(animate)
  const elapsed = clock.getElapsedTime()

  particles.update(elapsed)

  if (viewMode === 'cosmos') {
    scene.rotation.y = elapsed * 0.006
    cosmos.update(elapsed)
  } else {
    scene.rotation.y = 0
    globe.update(elapsed)
  }

  renderer.render(scene, camera)
}

// ── View switching ───────────────────────────────────────────────────────────
function switchView(mode) {
  if (mode === viewMode) return
  viewMode = mode

  viewBtns.forEach(b => b.classList.toggle('active', b.dataset.view === mode))

  if (mode === 'globe') {
    cosmos.spiralMesh.visible = false
    cosmos.nodes.forEach(n => { n.mesh.visible = false; n.ring.visible = false })
    if (cosmos.connectionLines) cosmos.connectionLines.visible = false
    globe.show()
    globeLight.intensity = 1.6
    dirLight.intensity = 0.3
  } else {
    cosmos.spiralMesh.visible = true
    cosmos.nodes.forEach(n => { n.mesh.visible = true; n.ring.visible = true })
    if (cosmos.connectionLines) cosmos.connectionLines.visible = true
    globe.hide()
    globeLight.intensity = 0
    dirLight.intensity = 1.2
    cosmos.navigateTo(currentT)
  }
}

viewBtns.forEach(btn => {
  btn.addEventListener('click', () => switchView(btn.dataset.view))
})

// ── Timeline ──────────────────────────────────────────────────────────────────
function setTimelineT(t) {
  currentT = Math.max(0, Math.min(1, t))
  timelineProgress.style.width = `${currentT * 100}%`
  timelineCursor.style.left    = `${currentT * 100}%`

  const era = [...ERAS].reverse().find(e => currentT >= e.t)
  currentEra.textContent = era ? era.label : ERAS[0].label

  if (viewMode === 'cosmos') cosmos.navigateTo(currentT)
}

timelineTrack.addEventListener('mousedown', e => {
  isDraggingTimeline = true
  updateTimelineFromPointer(e)
})
document.addEventListener('mousemove', e => {
  if (isDraggingTimeline) updateTimelineFromPointer(e)
})
document.addEventListener('mouseup', () => { isDraggingTimeline = false })

function updateTimelineFromPointer(e) {
  const rect = timelineTrack.getBoundingClientRect()
  setTimelineT((e.clientX - rect.left) / rect.width)
}

window.addEventListener('wheel', e => {
  if (viewMode !== 'cosmos') return
  setTimelineT(currentT + (e.deltaY > 0 ? 0.02 : -0.02))
}, { passive: true })

// ── Hover & click ─────────────────────────────────────────────────────────────
window.addEventListener('mousemove', e => {
  const ndcX =  (e.clientX / window.innerWidth)  * 2 - 1
  const ndcY = -(e.clientY / window.innerHeight) * 2 + 1

  if (viewMode === 'cosmos' && cosmos) {
    const node = cosmos.getHoveredNode(ndcX, ndcY)
    if (node !== hoveredNode) {
      hoveredNode = node
      cosmos.highlightNode(node)
      updateTooltip(node ? node.data : null, e)
      document.body.style.cursor = node ? 'pointer' : 'default'
    } else if (node) {
      tooltip.style.left = `${e.clientX + 14}px`
      tooltip.style.top  = `${e.clientY - 10}px`
    }
  } else if (viewMode === 'globe' && globe) {
    const marker = globe.getHoveredMarker(ndcX, ndcY, camera)
    if (marker !== hoveredNode) {
      hoveredNode = marker
      globe.highlightMarker(marker)
      updateTooltip(marker ? marker.data : null, e)
      document.body.style.cursor = marker ? 'pointer' : 'default'
    } else if (marker) {
      tooltip.style.left = `${e.clientX + 14}px`
      tooltip.style.top  = `${e.clientY - 10}px`
    }
  }
})

window.addEventListener('click', () => {
  if (!hoveredNode) return
  const data = hoveredNode.data ?? hoveredNode
  openDetailPanel(data)

  if (viewMode === 'cosmos' && hoveredNode.t !== undefined) {
    setTimelineT(hoveredNode.t)
  } else if (viewMode === 'globe' && hoveredNode.loc) {
    globe.focusOnLocation(hoveredNode.loc.lat, hoveredNode.loc.lon)
  }
})

function updateTooltip(event, e) {
  if (!event) {
    tooltip.classList.remove('visible')
    return
  }
  tooltipTitle.textContent = event.title
  tooltipDate.textContent  = event.date.label
  tooltip.style.left = `${e.clientX + 14}px`
  tooltip.style.top  = `${e.clientY - 10}px`
  tooltip.classList.add('visible')
}

// ── Detail panel ──────────────────────────────────────────────────────────────
function openDetailPanel(event) {
  detailCategory.textContent = event.category.toUpperCase()
  detailCategory.style.color = CATEGORY_COLORS_CSS[event.category] ?? '#aaa'
  detailTitle.textContent    = event.title
  detailDate.textContent     = event.date.label

  const loc = EVENT_LOCATIONS[event.id]
  if (loc) {
    detailLocation.textContent = '📍 ' + loc.name
    detailLocation.style.display = 'block'
  } else {
    detailLocation.style.display = 'none'
  }

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

detailClose.addEventListener('click', () => detailPanel.classList.remove('visible'))

// ── Category filters ───────────────────────────────────────────────────────────
filterBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    filterBtns.forEach(b => b.classList.remove('active'))
    btn.classList.add('active')
    activeFilter = btn.dataset.category
    if (cosmos) cosmos.filterByCategory(activeFilter)
    if (globe)  globe.filterByCategory(activeFilter)
  })
})

// ── Presentation mode ──────────────────────────────────────────────────────────
const PLAY_ICON  = '▶'
const PAUSE_ICON = '⏸'

function updatePlayBtn() {
  if (presentation.isPlaying && !presentation.isPaused) {
    btnPlay.textContent = PAUSE_ICON
    btnPlay.classList.add('active')
  } else {
    btnPlay.textContent = PLAY_ICON
    btnPlay.classList.remove('active')
  }
}

function onPresentationStep(event, index) {
  // Update counter
  eventCounter.textContent = `${index + 1} / ${events.length}`

  // Update timeline cursor
  const node = cosmos?.nodes.find(n => n.data.id === event.id)
  if (node) setTimelineT(node.t)

  // Show detail panel
  openDetailPanel(event)

  // In globe view, focus on event location
  if (viewMode === 'globe') {
    const loc = EVENT_LOCATIONS[event.id]
    if (loc) globe.focusOnLocation(loc.lat, loc.lon)
  }
}

function onPresentationEnd() {
  updatePlayBtn()
  eventCounter.textContent = `${events.length} / ${events.length}`
}

btnPlay.addEventListener('click', () => {
  if (!presentation.isPlaying) {
    presentation.play()
  } else if (presentation.isPaused) {
    presentation.resume()
  } else {
    presentation.pause()
  }
  updatePlayBtn()
})

btnPrev.addEventListener('click', () => {
  const idx = Math.max(0, presentation.currentIndex - 1)
  presentation.seekTo(idx)
  if (!presentation.isPlaying) {
    onPresentationStep(events[idx], idx)
    eventCounter.textContent = `${idx + 1} / ${events.length}`
  }
})

btnNext.addEventListener('click', () => {
  const idx = Math.min(events.length - 1, presentation.currentIndex + 1)
  presentation.seekTo(idx)
  if (!presentation.isPlaying) {
    onPresentationStep(events[idx], idx)
    eventCounter.textContent = `${idx + 1} / ${events.length}`
  }
})

btnSpeed.addEventListener('click', () => {
  speedIndex = (speedIndex + 1) % SPEEDS.length
  const s = SPEEDS[speedIndex]
  speedLabel.textContent = s.label
  presentation.setSpeed(s.ms)
})

// ── Resize ─────────────────────────────────────────────────────────────────────
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})

// ── Boot ───────────────────────────────────────────────────────────────────────
init()
