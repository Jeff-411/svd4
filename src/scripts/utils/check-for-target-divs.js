// src/scripts/utils/check-for-target-divs.js - v1

/**
 * Asynchronously waits for all required DOM elements to be present before resolving.
 *
 * This function implements a retry mechanism to handle the timing issues that occur
 * when Vivaldi's internal pages are loading. It recursively checks for elements
 * with a 500ms delay between attempts, up to a maximum of 10 retries.
 *
 * The function uses Promise-based recursion to ensure that it only resolves when
 * ALL required elements are present in the DOM. If any element is missing, it
 * will retry the entire check rather than proceeding with partial initialization.
 *
 * Required elements by page type:
 * - Bookmarks page: .bookmark.manager, .VivaldiList, .tree-row, .sortselector
 * - Windows and Tabs panel: #window-panel, .VivaldiList, .tree-row, .sortselector
 *
 * @param {string} page - The page type to check ('Bookmarks page' or other pages)
 * @param {boolean} debug - Toggle debug logging
 * @param {number} retryCount - Current retry attempt (used for recursion)
 * @returns {Promise<string>} - Resolves with 'done' when all elements are found,
 *                            - Rejects with Error if max retries exceeded
 */
import { setTargDivSelector } from './set-target-div-selector'

export const checkForTargDivs = async (page, debug, retryCount = 0) => {
  console.log(`[check targDivs]  ℹ️ Checking for ${page} elements... Attempt: ${retryCount}`)

  // Set selectors
  const targDivSelector = setTargDivSelector(page)
  const targDiv = document.querySelector(`${targDivSelector}`)
  const scrollDiv = document.querySelector(`${targDivSelector} .VivaldiList`)
  const scrollDivRow = document.querySelector(`${targDivSelector} .tree-row`)
  const sortbar = document.querySelector(`${targDivSelector} .sortselector`)

  const interval = 500

  if (!targDiv) {
    if (retryCount < 10) {
      if (debug) {
        console.log(`[check targDivs] [!targDiv] Looking for ${page}. Attempt: ${retryCount}`)
      }
      return new Promise(resolve => {
        setTimeout(() => {
          checkForTargDivs(page, debug, retryCount + 1).then(resolve)
        }, interval)
      })
    } else {
      console.error(
        `[check targDivs] ❌ ${page} not found after 10 retries:\n` +
          `Skipping ${page} initialization`
      )
      return Promise.reject(new Error(`${page} not found after 10 retries`))
    }
  }

  if (!scrollDiv) {
    if (retryCount < 10) {
      if (debug) {
        console.log(
          `[check targDivs] [!scrollDiv] Looking for ${page} -> VivaldiList. Attempt: ${retryCount}`
        )
      }
      return new Promise(resolve => {
        setTimeout(() => {
          checkForTargDivs(page, debug, retryCount + 1).then(resolve)
        }, interval)
      })
    } else {
      console.error(
        `[check targDivs] ❌ ${page} -> VivaldiList not found after 10 retries:\n` +
          `Skipping ${page} initialization`
      )
      return Promise.reject(new Error(`${page} -> VivaldiList not found after 10 retries`))
    }
  }

  if (!scrollDivRow) {
    if (retryCount < 10) {
      if (debug) {
        console.log(
          `[check targDivs] [!scrollDivRow] Looking for ${page} -> tree-row divs. Attempt: ${retryCount}`
        )
      }
      return new Promise(resolve => {
        setTimeout(() => {
          checkForTargDivs(page, debug, retryCount + 1).then(resolve)
        }, interval)
      })
    } else {
      console.error(
        `[check targDivs] ❌ No ${page} -> .tree-row divs found after 10 retries:\n` +
          `Skipping ${page} initialization`
      )
      return Promise.reject(new Error(`No ${page} -> .tree-row divs found after 10 retries`))
    }
  }

  if (page === 'Bookmarks page' && !sortbar) {
    if (retryCount < 10) {
      if (debug) {
        console.log(
          `[check targDivs] [!sortbar] Looking for ${page} -> .sortbar. Attempt: ${retryCount}`
        )
      }
      return new Promise(resolve => {
        setTimeout(() => {
          checkForTargDivs(page, debug, retryCount + 1).then(resolve)
        }, interval)
      })
    } else {
      console.error(
        `[check targDivs] ❌ ${page} -> .sortbar not found after 10 retries:\n` +
          `Skipping ${page} initialization`
      )
      return Promise.reject(new Error(`${page} -> .sortbar not found after 10 retries`))
    }
  }

  // Resolve when ALL required elements are present
  console.log(`[check targDivs]  ✅ All ${page} elements have loaded\n`)
  return Promise.resolve('done')
}
