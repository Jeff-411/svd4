// src/scripts/utils/enable-zoom.js - v1.0.1

/**
 * DIAGNOSTIC VERSION OF enable-zoom.js - v1
 * Adds deep debug instrumentation & optional fallback auto-scroll for drag operations
 *
 * CRITICAL VALUES (do not change without review):
 * - DEFAULT_INITIAL_ZOOM
 * - MIN_ZOOM / MAX_ZOOM
 * - AUTO_SCROLL_EDGE_PX_BASE
 * - AUTO_SCROLL_SPEED_BASE
 *
 * @param {string} page
 * @param {boolean} debug
 * @param {number} initialZoom
 * @param {object} options
 *   - enableFallbackAutoScroll {boolean} (default: true)
 *   - fallbackActivationDelayMs {number} (default: 400)
 */
import { setTargDivSelector } from '../utils/set-target-div-selector'

const DEFAULT_INITIAL_ZOOM = 2.0 // CRITICAL
const MIN_ZOOM = 0.5 // CRITICAL
const MAX_ZOOM = 3.0 // CRITICAL
const ZOOM_STEP = 0.1 // CRITICAL

// Base (unscaled) edge thickness used to detect proximity for auto-scroll
const AUTO_SCROLL_EDGE_PX_BASE = 60 // CRITICAL
const AUTO_SCROLL_SPEED_BASE = 32 // CRITICAL (pixels per second baseline)

// Utility: clamp
const clamp = (val, min, max) => Math.min(Math.max(val, min), max)

export const enableZoom = (page, debug, initialZoom = DEFAULT_INITIAL_ZOOM, options = {}) => {
  const { enableFallbackAutoScroll = true, fallbackActivationDelayMs = 400 } = options

  if (debug) console.log(`[enable zoom:v2] ℹ️ Init for ${page} (initialZoom=${initialZoom})`)
  else console.log('[enable zoom]  ℹ️ Initializing zoom...')

  // Selector resolution
  const targDivSelector = setTargDivSelector(page)
  const scrollDiv = `${targDivSelector} .VivaldiList`
  const vivaldiList = document.querySelector(scrollDiv)

  if (!vivaldiList) {
    console.error('[enable zoom] ❌ VivaldiList element not found')
    return
  }

  // State
  let currentZoom = clamp(initialZoom, MIN_ZOOM, MAX_ZOOM)
  let dragActive = false
  let nativeAutoScrollObserved = false
  let fallbackAutoScrollEnabled = false
  let lastScrollTop = vivaldiList.scrollTop
  let dragStartTime = 0
  let lastDragLogAt = 0
  let manualScrollRAF = null

  // Apply zoom
  vivaldiList.style.setProperty('zoom', currentZoom.toString())
  vivaldiList.style.setProperty('transform-origin', 'top left')
  vivaldiList.dataset.zoomEnabled = 'true'

  // ---- Helper Logging -------------------------------------------------------
  const log = (...args) => {
    if (debug) console.log('[enable zoom:v2]', ...args)
  }

  const group = (label, fn) => {
    if (!debug) return fn()
    console.groupCollapsed(label)
    try {
      fn()
    } finally {
      console.groupEnd()
    }
  }

  // ---- Zoom Control UI ------------------------------------------------------
  const toolbarGroup = document.querySelector('.bookmark.manager .toolbar-group:last-child')
  if (toolbarGroup) {
    const zoomContainer = document.createElement('div')
    zoomContainer.className = 'button-toolbar zoom-controls'
    zoomContainer.style.marginLeft = '10px'

    const mkBtn = (label, title) => {
      const b = document.createElement('button')
      b.className = 'ToolbarButton-Button'
      b.textContent = label
      b.title = title
      return b
    }

    const zoomOutBtn = mkBtn('🔍−', 'Zoom Out (Ctrl+-)')
    const zoomResetBtn = mkBtn(`🔍${currentZoom.toFixed(1)}x`, 'Reset Zoom (Ctrl+0)')
    const zoomInBtn = mkBtn('🔍+', 'Zoom In (Ctrl++)')

    function applyZoom() {
      vivaldiList.style.setProperty('zoom', currentZoom.toString())
      zoomResetBtn.textContent = `🔍${currentZoom.toFixed(1)}x`
      log('Zoom applied', { currentZoom })
    }

    zoomOutBtn.addEventListener('click', () => {
      currentZoom = clamp(currentZoom - ZOOM_STEP, MIN_ZOOM, MAX_ZOOM)
      applyZoom()
    })

    zoomResetBtn.addEventListener('click', () => {
      currentZoom = clamp(initialZoom, MIN_ZOOM, MAX_ZOOM)
      applyZoom()
    })

    zoomInBtn.addEventListener('click', () => {
      currentZoom = clamp(currentZoom + ZOOM_STEP, MIN_ZOOM, MAX_ZOOM)
      applyZoom()
    })

    zoomContainer.appendChild(zoomOutBtn)
    zoomContainer.appendChild(zoomResetBtn)
    zoomContainer.appendChild(zoomInBtn)
    toolbarGroup.appendChild(zoomContainer)
  } else {
    log('⚠️ toolbar-group not found for zoom buttons')
  }

  // ---- Keyboard Zoom --------------------------------------------------------
  document.addEventListener('keydown', e => {
    if (!(e.ctrlKey || e.metaKey)) return
    if (e.key === '+') {
      currentZoom = clamp(currentZoom + ZOOM_STEP, MIN_ZOOM, MAX_ZOOM)
      vivaldiList.style.setProperty('zoom', currentZoom.toString())
      e.preventDefault()
    } else if (e.key === '-') {
      currentZoom = clamp(currentZoom - ZOOM_STEP, MIN_ZOOM, MAX_ZOOM)
      vivaldiList.style.setProperty('zoom', currentZoom.toString())
      e.preventDefault()
    } else if (e.key === '0') {
      currentZoom = clamp(initialZoom, MIN_ZOOM, MAX_ZOOM)
      vivaldiList.style.setProperty('zoom', currentZoom.toString())
      e.preventDefault()
    }
  })

  // ---- Mouse Wheel Zoom -----------------------------------------------------
  vivaldiList.addEventListener(
    'wheel',
    e => {
      if (e.ctrlKey || e.metaKey) {
        if (e.deltaY < 0) currentZoom = clamp(currentZoom + ZOOM_STEP, MIN_ZOOM, MAX_ZOOM)
        else currentZoom = clamp(currentZoom - ZOOM_STEP, MIN_ZOOM, MAX_ZOOM)
        vivaldiList.style.setProperty('zoom', currentZoom.toString())
        e.preventDefault()
      }
    },
    { passive: false }
  )

  // ---- Drag Diagnostics -----------------------------------------------------
  const EDGE_DYNAMIC = () => AUTO_SCROLL_EDGE_PX_BASE * (1 / currentZoom)
  const SCROLL_SPEED_PX_PER_FRAME = () => (AUTO_SCROLL_SPEED_BASE * currentZoom) / 60

  function detectNativeAutoScroll() {
    const nowScrollTop = vivaldiList.scrollTop
    if (nowScrollTop !== lastScrollTop) {
      const delta = nowScrollTop - lastScrollTop
      if (dragActive && Math.abs(delta) > 0) {
        nativeAutoScrollObserved = true
      }
      lastScrollTop = nowScrollTop
    }
    if (dragActive) requestAnimationFrame(detectNativeAutoScroll)
  }

  function startManualAutoScrollLoop() {
    if (!fallbackAutoScrollEnabled) return
    if (manualScrollRAF) return
    let lastDir = 0
    const loop = () => {
      if (!dragActive || !fallbackAutoScrollEnabled) {
        manualScrollRAF = null
        return
      }
      if (lastDir !== 0) {
        vivaldiList.scrollTop += lastDir * SCROLL_SPEED_PX_PER_FRAME()
      }
      manualScrollRAF = requestAnimationFrame(loop)
    }
    manualScrollRAF = requestAnimationFrame(loop)
    return dir => {
      lastDir = dir // -1 up, 1 down, 0 none
    }
  }

  let setManualScrollDir = null

  function maybeActivateFallback() {
    if (!enableFallbackAutoScroll) return
    if (nativeAutoScrollObserved) return
    if (!dragActive) return
    fallbackAutoScrollEnabled = true
    log('⚠️ Native auto-scroll not detected; fallback activated')
    setManualScrollDir = startManualAutoScrollLoop()
  }

  function logDragMetrics(e, tag) {
    const now = performance.now()
    if (now - lastDragLogAt < 80) return // throttle
    lastDragLogAt = now
    const rect = vivaldiList.getBoundingClientRect()
    const edge = EDGE_DYNAMIC()
    const distanceTop = e.clientY - rect.top
    const distanceBottom = rect.bottom - e.clientY
    group(`[drag:${tag}]`, () => {
      console.log('cursor', { clientX: e.clientX, clientY: e.clientY })
      console.log('container', {
        top: rect.top,
        bottom: rect.bottom,
        height: rect.height,
        scrollTop: vivaldiList.scrollTop,
        scrollHeight: vivaldiList.scrollHeight,
      })
      console.log('zoom metrics', {
        currentZoom,
        edgeThresholdPxDynamic: edge.toFixed(2),
        speedPerFrame: SCROLL_SPEED_PX_PER_FRAME().toFixed(2),
      })
      console.log('edge distances', {
        distanceTop: distanceTop.toFixed(2),
        distanceBottom: distanceBottom.toFixed(2),
      })
      console.log('flags', {
        nativeAutoScrollObserved,
        fallbackAutoScrollEnabled,
        dragActive,
      })
    })
  }

  // Listen globally (drag events may bubble oddly)
  document.addEventListener('dragstart', e => {
    if (!(e.target && (e.target.closest('.tree-row') || e.target.classList.contains('tree-row'))))
      return
    dragActive = true
    dragStartTime = performance.now()
    nativeAutoScrollObserved = false
    fallbackAutoScrollEnabled = false
    log('Drag started')
    lastScrollTop = vivaldiList.scrollTop
    requestAnimationFrame(detectNativeAutoScroll)
    setTimeout(maybeActivateFallback, fallbackActivationDelayMs)
  })

  document.addEventListener('dragend', () => {
    if (!dragActive) return
    dragActive = false
    log('Drag ended', {
      nativeAutoScrollObserved,
      fallbackAutoScrollEnabled,
      durationMs: (performance.now() - dragStartTime).toFixed(1),
    })
    fallbackAutoScrollEnabled = false
    if (manualScrollRAF) {
      cancelAnimationFrame(manualScrollRAF)
      manualScrollRAF = null
    }
    setManualScrollDir = null
  })

  document.addEventListener('dragover', e => {
    if (!dragActive) return
    logDragMetrics(e, 'move')
    const rect = vivaldiList.getBoundingClientRect()
    const edge = EDGE_DYNAMIC()
    const distanceTop = e.clientY - rect.top
    const distanceBottom = rect.bottom - e.clientY

    if (fallbackAutoScrollEnabled && setManualScrollDir) {
      if (distanceTop < edge && vivaldiList.scrollTop > 0) {
        setManualScrollDir(-1)
      } else if (
        distanceBottom < edge &&
        vivaldiList.scrollTop + rect.height < vivaldiList.scrollHeight
      ) {
        setManualScrollDir(1)
      } else {
        setManualScrollDir(0)
      }
    }
  })

  // Periodic passive monitor (extra safety)
  if (debug) {
    setInterval(() => {
      if (!dragActive) return
      const state = {
        scrollTop: vivaldiList.scrollTop,
        scrollHeight: vivaldiList.scrollHeight,
        clientHeight: vivaldiList.clientHeight,
        nativeAutoScrollObserved,
        fallbackAutoScrollEnabled,
      }
      log('Heartbeat', state)
    }, 1000)
  }

  // ---- Validation -----------------------------------------------------------
  const appliedZoom = vivaldiList.style.getPropertyValue('zoom')
  if (appliedZoom === currentZoom.toString()) {
    log(' ✅ Zoom style applied', appliedZoom)
  } else {
    console.error('[enable zoom] ❌ Zoom style mismatch', {
      expected: currentZoom,
      got: appliedZoom,
    })
  }

  console.log(
    `[enable zoom] ✅ Zoom v2 enabled (initial=${initialZoom} applied=${currentZoom}) debug=${!!debug}`
  )
}
