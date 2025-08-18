// src/scripts/utils/set-target-div-selector.js - v1

export const setTargDivSelector = page => {
  let targDivSelector = null

  switch (page) {
    case 'Bookmarks page':
      targDivSelector = '.bookmark.manager'
      break
    case 'Window panel':
      targDivSelector = '#window-panel'
      break
    default:
      console.error(`[setTargDivSelector] ❌ The "${page}" page is not supported at this time.`)
      return
  }

  return targDivSelector
}
