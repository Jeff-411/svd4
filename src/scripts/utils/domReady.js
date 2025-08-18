// src/scripts/utils/domReady.js - v1

/**
 * Utility for executing callbacks when the DOM is ready
 *
 * Standardizes DOM ready handling across the codebase and
 * eliminates redundant checks in multiple files
 */

/**
 * Executes the provided callback when the DOM is ready
 * If DOM is already loaded, executes callback immediately
 *
 * @param {Function} callback - Function to execute when DOM is ready
 * @param {number} [delay=0] - Optional delay in ms to add after DOM ready
 */
export function domReady(callback, delay = 0) {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      if (delay > 0) {
        setTimeout(callback, delay)
      } else {
        callback()
      }
    })
  } else {
    if (delay > 0) {
      setTimeout(callback, delay)
    } else {
      callback()
    }
  }
}

/**
 * Returns a promise that resolves when the DOM is ready
 * Can be used with async/await for cleaner code
 *
 * @param {number} [delay=0] - Optional delay in ms to add after DOM ready
 * @returns {Promise<void>} - Promise that resolves when DOM is ready
 */
export function domReadyPromise(delay = 0) {
  return new Promise(resolve => {
    domReady(() => resolve(), delay)
  })
}
