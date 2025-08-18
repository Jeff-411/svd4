// src/scripts/index.js - v1

/**
 * See Vivaldi - Main Entry Point
 * Enhanced visual accessibility for Vivaldi browser internal pages
 */

import { domReady } from './utils/domReady.js'
import { initBookmarksPage } from './bookmarks-page/init-bookmarks-page.js'

/**
 * Main initialization function that sets up all features
 */
function initializeAllFeatures() {
  // Initialize the Bookmarks (vivaldi:bookmarks) page
  initBookmarksPage()
}

// Start the application when DOM is ready
domReady(initializeAllFeatures)
