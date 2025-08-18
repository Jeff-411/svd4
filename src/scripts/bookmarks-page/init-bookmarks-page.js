// src/scripts/bookmarks-page/init-bookmarks-page.js - v1

import { domReady } from '../utils/domReady.js'
import { checkForTargDivs } from '../utils/check-for-target-divs.js'
import { enableZoom } from '../utils/enable-zoom.js'
import { handleSortbar } from './handle-sortbar.js'

/**
 * Initialize all Bookmarks (vivaldi:bookmarks) page handlers.
 * Note:
 * 1. Handler scripts in handleAll() below use the same parameters:
 * @param {string} page - The page type to check ('Bookmarks page' or 'Window panel')
 * @param {boolean} debug - Toggle debug logging
 */
const handleAll = async () => {
  const page = 'Bookmarks page'

  // Wait for all required elements to be available
  await checkForTargDivs(page, false)

  enableZoom(page, true)

  handleSortbar(false)
}

/**
 * Initialize all handlers when DOM is ready
 * Reinitialize all handlers when DOM changes
 */
export const initBookmarksPage = () => {
  'use strict'

  domReady(() => handleAll(), 100)

  window.addEventListener('popstate', () => domReady(() => handleAll(), 100))
  window.addEventListener('hashchange', () => domReady(() => handleAll(), 100))
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      domReady(() => handleAll(), 100)
    }
  })
}
