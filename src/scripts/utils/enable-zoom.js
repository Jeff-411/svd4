// src/scripts/utils/enable-zoom.js - v1

/**
 * Enables zoom for the `.VivaldiList` div on the `vivaldi:bookmarks` page, and
 * potentially other internal Vivaldi pages as well.
 *
 * @param {string} page - The targeted page (e.g.: 'Bookmarks page', 'Window panel)
 * @param {boolean} debug - Toggle debug logging
 * @param {number} initialZoom - Starting zoom level (default: 2.0)
 */
import { setTargDivSelector } from './set-target-div-selector'

export const enableZoom = (page, debug, initialZoom = 2.0) => {
  if (debug) console.log(`[enable zoom]  ℹ️ Debugging zoom for ${page}...`)
  else console.log(`[enable zoom]  ℹ️ Initializing zoom for ${page}...`)

  // Set selectors
  const targDivSelector = setTargDivSelector(page)
  const scrollDiv = `${targDivSelector} .VivaldiList`

  // Get the target element
  const vivaldiList = document.querySelector(scrollDiv)

  if (!vivaldiList) {
    console.error('[enable zoom] ❌ VivaldiList element not found')
    return
  }

  // Set CSS to enable standard browser zoom
  vivaldiList.style.setProperty('zoom', initialZoom)
  vivaldiList.style.setProperty('transform-origin', 'top left')

  // Store current zoom level in a variable rather than localStorage
  let currentZoom = initialZoom

  // Add zoom controls to the interface
  const toolbarGroup = document.querySelector('.bookmark.manager .toolbar-group:last-child')
  if (toolbarGroup) {
    const zoomContainer = document.createElement('div')
    zoomContainer.className = 'button-toolbar zoom-controls'
    zoomContainer.style.marginLeft = '10px'

    const zoomOutBtn = document.createElement('button')
    zoomOutBtn.className = 'ToolbarButton-Button'
    zoomOutBtn.textContent = '🔍−'
    zoomOutBtn.title = 'Zoom Out (Ctrl+-)'

    const zoomResetBtn = document.createElement('button')
    zoomResetBtn.className = 'ToolbarButton-Button'
    zoomResetBtn.textContent = `🔍${currentZoom.toFixed(1)}x`
    zoomResetBtn.title = 'Reset Zoom (Ctrl+0)'

    const zoomInBtn = document.createElement('button')
    zoomInBtn.className = 'ToolbarButton-Button'
    zoomInBtn.textContent = '🔍+'
    zoomInBtn.title = 'Zoom In (Ctrl++)'

    zoomOutBtn.addEventListener('click', () => {
      currentZoom = Math.max(currentZoom - 0.1, 0.5)
      updateZoom()
    })

    zoomResetBtn.addEventListener('click', () => {
      currentZoom = initialZoom
      updateZoom()
    })

    zoomInBtn.addEventListener('click', () => {
      currentZoom = Math.min(currentZoom + 0.1, 3.0)
      updateZoom()
    })

    zoomContainer.appendChild(zoomOutBtn)
    zoomContainer.appendChild(zoomResetBtn)
    zoomContainer.appendChild(zoomInBtn)
    toolbarGroup.appendChild(zoomContainer)

    // Function to update zoom level and button text
    function updateZoom() {
      vivaldiList.style.setProperty('zoom', currentZoom)
      zoomResetBtn.textContent = `🔍${currentZoom.toFixed(1)}x`
    }
  }

  // Enable zoom with keyboard shortcuts
  document.addEventListener('keydown', e => {
    // Ctrl/Cmd + Plus to zoom in
    if ((e.ctrlKey || e.metaKey) && e.key === '+') {
      currentZoom = Math.min(currentZoom + 0.1, 3.0)
      vivaldiList.style.setProperty('zoom', currentZoom)
      e.preventDefault()
    }

    // Ctrl/Cmd + Minus to zoom out
    if ((e.ctrlKey || e.metaKey) && e.key === '-') {
      currentZoom = Math.max(currentZoom - 0.1, 0.5)
      vivaldiList.style.setProperty('zoom', currentZoom)
      e.preventDefault()
    }

    // Ctrl/Cmd + 0 to reset zoom
    if ((e.ctrlKey || e.metaKey) && e.key === '0') {
      currentZoom = initialZoom
      vivaldiList.style.setProperty('zoom', currentZoom)
      e.preventDefault()
    }
  })

  // Enable zoom with mouse wheel
  vivaldiList.addEventListener(
    'wheel',
    e => {
      if (e.ctrlKey || e.metaKey) {
        if (e.deltaY < 0) {
          currentZoom = Math.min(currentZoom + 0.1, 3.0)
        } else {
          currentZoom = Math.max(currentZoom - 0.1, 0.5)
        }
        vivaldiList.style.setProperty('zoom', currentZoom)
        e.preventDefault()
      }
    },
    { passive: false }
  )

  console.log(`[enable zoom] ✅ Zoom enabled with initial level ${initialZoom}x`)
}
