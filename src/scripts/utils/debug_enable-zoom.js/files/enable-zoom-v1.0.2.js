// src/scripts/utils/enable-zoom.js - v1.0.2
/**
 * DIAGNOSTIC VERSION
 * Adds deep debug instrumentation & optional fallback auto-scroll for drag operations
 *
 * CRITICAL VALUES (do not change without review):
 * - DEFAULT_INITIAL_ZOOM
 * - MIN_ZOOM / MAX_ZOOM
 * - AUTO_SCROLL_EDGE_PX_BASE
 * - AUTO_SCROLL_SPEED_BASE
 *
 * Wheel shortcut updated: now requires Ctrl+Shift (or Cmd+Shift) + mousewheel.
 * v8: Added dynamic bottom padding to compensate for zoom-induced bottom clipping.
 * v9: Refined bottom padding algorithm to reduce excessive blank space while keeping last item reachable.
 * v10: Replaced formula with piecewise anchor interpolation derived from empirically chosen "reasonable" paddings.
 *       Anchors scale proportionally with current clientHeight to adapt to different viewport heights.
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

// Anchor table (zoom -> padding px) captured at clientHeight ≈ 531px.
// Converted to ratios so they scale with actual clientHeight.
// Order ascending by zoom (required for interpolation).
const PADDING_ANCHORS = [
  { z: 1.0, px: 20 },
  { z: 1.1, px: 70 },
  { z: 1.3, px: 150 },
  { z: 1.5, px: 200 },
  { z: 1.7, px: 230 },
  { z: 2.0, px: 280 },
  { z: 2.2, px: 310 },
  { z: 2.4, px: 330 },
  { z: 2.6, px: 340 },
  { z: 2.8, px: 350 },
  { z: 3.0, px: 360 },
]
// Precompute ratios relative to baselineHeight 531
const BASELINE_HEIGHT = 531
const PADDING_RATIOS = PADDING_ANCHORS.map(a => ({ z: a.z, r: a.px / BASELINE_HEIGHT }))

export const enableZoom = (page, debug, initialZoom = DEFAULT_INITIAL_ZOOM, options = {}) => {
  const { enableFallbackAutoScroll = true, fallbackActivationDelayMs = 400 } = options

  if (debug)
    console.log(`[enable zoom: example1b.js] ℹ️ Init for ${page} (initialZoom=${initialZoom})`)
  else console.log('[enable zoom: example1b.js]  ℹ️ Initializing zoom...')

  // Selector resolution
  const targDivSelector = setTargDivSelector(page)
  const scrollDiv = `${targDivSelector} .VivaldiList`
  const vivaldiList = document.querySelector(scrollDiv)

  if (!vivaldiList) {
    console.error('[enable zoom: example1b.js] ❌ VivaldiList element not found')
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

  // UI element refs
  let zoomResetBtn = null

  // Apply initial zoom
  vivaldiList.style.setProperty('zoom', currentZoom.toString())
  vivaldiList.style.setProperty('transform-origin', 'top left')
  vivaldiList.dataset.zoomEnabled = 'true'

  // ---- Helper Logging -------------------------------------------------------
  const log = (...args) => {
    if (debug) console.log('[enable zoom: example1b.js]', ...args)
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

  // Piecewise interpolated bottom padding:
  // 1. Determine ratio r for currentZoom via linear interpolation of PADDING_RATIOS.
  // 2. extra = round(r * clientHeight).
  // 3. Cap extra to theoreticalExtra = (zoom - 1) * clientHeight (cannot need more than scaled delta).
  // 4. Ensure extra >= 0.
  function interpolatePaddingRatio(z) {
    if (z <= PADDING_RATIOS[0].z) return PADDING_RATIOS[0].r
    if (z >= PADDING_RATIOS[PADDING_RATIOS.length - 1].z)
      return PADDING_RATIOS[PADDING_RATIOS.length - 1].r
    for (let i = 0; i < PADDING_RATIOS.length - 1; i++) {
      const a = PADDING_RATIOS[i]
      const b = PADDING_RATIOS[i + 1]
      if (z >= a.z && z <= b.z) {
        const t = (z - a.z) / (b.z - a.z)
        return a.r + (b.r - a.r) * t
      }
    }
    return PADDING_RATIOS[PADDING_RATIOS.length - 1].r
  }

  function updateBottomPadding() {
    // No artificial padding when zoom <= 1 (retain slight minimal anchor if desired? requirement says 1.0 -> 20px, keep anchor)
    const clientH = vivaldiList.clientHeight
    let extra = 0
    if (currentZoom > 1 || currentZoom === 1) {
      const ratio = interpolatePaddingRatio(currentZoom)
      extra = Math.round(ratio * clientH)
      const theoreticalExtra = Math.max(0, (currentZoom - 1) * clientH)
      if (extra > theoreticalExtra) {
        // At low zoom (1.0 – 1.1) anchors intentionally exceed theoreticalExtra; allow a gentle relaxation:
        // Permit up to 1.35 * theoreticalExtra for z < 1.2, else clamp hard.
        const limit =
          currentZoom < 1.2 ? Math.round(theoreticalExtra * 1.35) : Math.round(theoreticalExtra)
        if (extra > limit) extra = limit
      }
      if (extra < 0) extra = 0
    }
    vivaldiList.style.paddingBottom = extra ? `${extra}px` : ''
    if (debug) {
      const theoreticalExtra = Math.max(0, (currentZoom - 1) * clientH)
      log('paddingAdjusted', {
        currentZoom,
        clientH,
        theoreticalExtra: Math.round(theoreticalExtra),
        applied: extra,
        ratioUsed: currentZoom > 0 ? (extra / (clientH || 1)).toFixed(4) : 0,
      })
    }
  }

  function updateZoomButtonLabel() {
    if (zoomResetBtn) zoomResetBtn.textContent = `🔍${currentZoom.toFixed(1)}x`
  }

  function applyZoom(origin = 'unknown') {
    vivaldiList.style.setProperty('zoom', currentZoom.toString())
    updateZoomButtonLabel()
    updateBottomPadding()
    requestAnimationFrame(() => updateBottomPadding())
    log('Zoom applied', { currentZoom, origin })
  }

  // Initial padding adjustment (double-pass for initial layout)
  updateBottomPadding()
  requestAnimationFrame(() => updateBottomPadding())

  // Recompute padding on container resize (window resize may change clientHeight)
  window.addEventListener('resize', () => updateBottomPadding())

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
    zoomResetBtn = mkBtn(`🔍${currentZoom.toFixed(1)}x`, 'Reset Zoom (Ctrl+0)')
    const zoomInBtn = mkBtn('🔍+', 'Zoom In (Ctrl+=)')
    // (Wheel shortcut now: Ctrl+Shift+Wheel)

    zoomOutBtn.addEventListener('click', () => {
      currentZoom = clamp(currentZoom - ZOOM_STEP, MIN_ZOOM, MAX_ZOOM)
      applyZoom('button:out')
    })

    zoomResetBtn.addEventListener('click', () => {
      currentZoom = clamp(initialZoom, MIN_ZOOM, MAX_ZOOM)
      applyZoom('button:reset')
    })

    zoomInBtn.addEventListener('click', () => {
      currentZoom = clamp(currentZoom + ZOOM_STEP, MIN_ZOOM, MAX_ZOOM)
      applyZoom('button:in')
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
    const k = e.key
    if (k === '+' || k === '=') {
      const prev = currentZoom
      currentZoom = clamp(currentZoom + ZOOM_STEP, MIN_ZOOM, MAX_ZOOM)
      if (currentZoom !== prev) applyZoom('key:plus')
      e.preventDefault()
    } else if (k === '-' || k === '_') {
      const prev = currentZoom
      currentZoom = clamp(currentZoom - ZOOM_STEP, MIN_ZOOM, MAX_ZOOM)
      if (currentZoom !== prev) applyZoom('key:minus')
      e.preventDefault()
    } else if (k === '0') {
      currentZoom = clamp(initialZoom, MIN_ZOOM, MAX_ZOOM)
      applyZoom('key:reset')
      e.preventDefault()
    }
  })

  // ---- Mouse Wheel Zoom (now Ctrl+Shift) ------------------------------------
  vivaldiList.addEventListener(
    'wheel',
    e => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey) {
        currentZoom = clamp(
          currentZoom + (e.deltaY < 0 ? ZOOM_STEP : -ZOOM_STEP),
          MIN_ZOOM,
          MAX_ZOOM
        )
        applyZoom('wheel:list')
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
    if (now - lastDragLogAt < 80) return
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
    console.error('[enable zoom: example1b.js] ❌ Zoom style mismatch', {
      expected: currentZoom,
      got: appliedZoom,
    })
  }

  console.log(
    `[enable zoom: example1b.js] ✅ Zoom enabled (initial=${initialZoom} applied=${currentZoom}) debug=${!!debug}`
  )
}
