// handleBookmarksPageSortbar.js - v1

/**
 * Handle bookmarks page sortbar layout
 * Sets up Title + Nickname column layout and hides unwanted columns
 */
export function handleSortbar(debug) {
  const sortbar = document.querySelector('.bookmark.manager .sortselector')

  if (!sortbar) {
    console.error('[handle sortbar] ❌ sortbar element not found')
    return
  }

  console.log('[handle sortbar]  ℹ️ Customizing sortbar layout ...')

  // Log the current style for debugging
  if (debug) {
    const originalStyle = sortbar.getAttribute('style')
    console.log('sortbar original style:', originalStyle)
  }

  // **CRITICAL VALUES - DO NOT ALTER**
  // Column 1: Title - minmax(100px, 1fr)
  // Column 3: Nickname - minmax(36px, 174px)
  const customGridColumns = 'minmax(100px, 1fr) minmax(36px, 174px)'
  const customStyle = `grid-template-columns: ${customGridColumns}; --columnHeight: 524px;`

  // Replace the sortbar style attribute with our custom layout
  sortbar.setAttribute('style', customStyle)

  // **CRITICAL: Update the --gridColumns CSS variable on the vivaldi-tree element**
  const vivaldiTree = document.querySelector('.bookmark.manager .vivaldi-tree')
  if (vivaldiTree) {
    vivaldiTree.style.setProperty('--gridColumns', customGridColumns)
    if (debug) console.log('Updated --gridColumns CSS variable on .vivaldi-tree')
  } else {
    if (debug) console.error('[handle sortbar] ❌ vivaldi-tree element not found')
  }

  // **HIDE UNWANTED COLUMNS**
  // Hide Address (column 2), Description (column 4), and Date Created (column 5) divs
  const sortbarDivs = sortbar.querySelectorAll(':scope > div')
  if (debug) console.log(`Found ${sortbarDivs.length} sortbar column divs`)

  if (sortbarDivs.length >= 3) {
    // Assuming the original order: Title, Address, Nickname, Description, Date Created
    // We need to identify which columns to hide by their button titles
    let hiddenCount = 0
    const hiddenColumns = []

    sortbarDivs.forEach((div, index) => {
      const button = div.querySelector('button[title]')
      const title = button ? button.getAttribute('title') : ''

      // Keep only Title and Nickname columns
      const isTitle = title.includes('Sort by title')
      const isNickname = title.includes('Sort by nickname')

      if (!isTitle && !isNickname) {
        div.style.display = 'none'
        hiddenCount++
        hiddenColumns.push(title || `column ${index}`)
        if (debug) console.log(`Hidden column ${index}: ${title || `column ${index}`}`)
      }
    })

    if (debug) console.log(`Hidden ${hiddenCount} columns:`, hiddenColumns)
  } else {
    if (debug)
      console.log(
        `[handle sortbar] ⚠️ Warning: Expected at least 3 sortbar columns, found ${sortbarDivs.length}`
      )
  }

  // Verify the changes were applied
  const newStyle = sortbar.getAttribute('style')
  const newGridColumns = vivaldiTree
    ? vivaldiTree.style.getPropertyValue('--gridColumns')
    : 'not found'

  if (debug) console.log('sortbar new style:', newStyle)
  if (debug) console.log('vivaldi-tree --gridColumns:', newGridColumns)

  // **VALIDATION STEP**
  if (newStyle === customStyle) {
    if (debug) console.log('✓ sortbar style successfully updated')
  } else {
    console.error(
      '[handle sortbar] ❌ Failed to update sortbar style. Expected:',
      customStyle,
      'Got:',
      newStyle
    )
  }

  if (newGridColumns === customGridColumns) {
    console.log('[handle sortbar]  ✅ sortbar layout successfully updated')
  } else {
    console.error(
      '[handle sortbar] ❌ Failed to update --gridColumns. Expected:',
      customGridColumns,
      'Got:',
      newGridColumns
    )
  }
}
