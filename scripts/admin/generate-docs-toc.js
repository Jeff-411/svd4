const fs = require('fs').promises
const path = require('path')

/**
 * Recursively walks a directory and generates a markdown TOC
 * @param {string} dir - Directory to scan
 * @param {string} baseDir - Base directory for calculating relative paths
 * @param {number} level - Current nesting level (for indentation)
 * @returns {Promise<string[]>} Array of markdown lines
 */
async function walkDirectory(dir, baseDir, level = 0) {
  const items = await fs.readdir(dir)
  const lines = []

  // Get stats for all items
  const itemStats = await Promise.all(
    items.map(async item => {
      const itemPath = path.join(dir, item)
      const stats = await fs.stat(itemPath)
      return {
        name: item,
        path: itemPath,
        isDirectory: stats.isDirectory(),
      }
    })
  )

  // Sort items: directories first, then files alphabetically
  const sorted = itemStats.sort((a, b) => {
    if (a.isDirectory && !b.isDirectory) return -1
    if (!a.isDirectory && b.isDirectory) return 1
    return a.name.localeCompare(b.name)
  })

  for (const item of sorted) {
    // Skip hidden files and directories
    if (item.name.startsWith('.')) continue

    const relativePath = path.relative(baseDir, item.path)
    const indent = '  '.repeat(level)

    if (item.isDirectory) {
      // Add directory as a section header
      lines.push(`${indent}- **${item.name}/**`)

      // Recursively get contents of the directory
      const childLines = await walkDirectory(item.path, baseDir, level + 1)
      lines.push(...childLines)
    } else {
      // Skip the root TABLE_OF_CONTENTS.md as it's what we're generating
      if (level === 0 && item.name === 'TABLE_OF_CONTENTS.md') continue

      // Add file as a link
      const displayName = item.name.replace(/\.md$/, '')
      lines.push(`${indent}- [${displayName}](${relativePath.replace(/\\/g, '/')})`)
    }
  }

  return lines
}

/**
 * Generates a markdown TOC for the docs directory
 */
async function generateDocsToc() {
  try {
    const docsDir = path.resolve(__dirname, '../..', 'docs')
    const tocPath = path.join(docsDir, 'TABLE_OF_CONTENTS.md')

    console.log('Generating docs table of contents...')

    // Preserve the title from the original TABLE_OF_CONTENTS.md if it exists
    let title = '# See Vivaldi Documentation'
    try {
      const content = await fs.readFile(tocPath, 'utf8')
      const titleMatch = content.match(/^# .+$/m)
      if (titleMatch) {
        title = titleMatch[0]
      }
    } catch (err) {
      // File might not exist, use default title
      console.log('Using default title for TABLE_OF_CONTENTS.md')
    }

    const tocLines = await walkDirectory(docsDir, docsDir)

    const newContent = [
      title,
      '',
      '## Table of Contents',
      '',
      '> To generate this Table of Contents, run: `npm run docs:toc`',
      '',
      ...tocLines,
      '',
      '---',
      '',
      'Last updated: ' + new Date().toISOString().split('T')[0],
    ].join('\n')

    await fs.writeFile(tocPath, newContent)
    console.log(`✅ Documentation TOC generated successfully at: ${tocPath}`)
  } catch (error) {
    console.error('Error generating docs TOC:', error)
  }
}

// Execute the function if run directly
if (require.main === module) {
  generateDocsToc()
}

// Export for potential programmatic use
module.exports = { generateDocsToc }
