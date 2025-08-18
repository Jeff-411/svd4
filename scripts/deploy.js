// scripts/deploy.js - v2

const fs = require('fs')
const path = require('path')
const os = require('os')

/**
 * Deploy script to copy built custom.js to Vivaldi installation
 * Now with automatic Vivaldi version detection and window.html management
 */

function findVivaldiInstallation() {
  const username = os.userInfo().username
  const vivaldiBasePath = `C:/Users/${username}/AppData/Local/Vivaldi/Application`

  if (!fs.existsSync(vivaldiBasePath)) {
    throw new Error(`Vivaldi application directory not found: ${vivaldiBasePath}`)
  }

  // Find all version directories (format: x.x.xxxx.xx)
  const versions = fs
    .readdirSync(vivaldiBasePath)
    .filter(dir => /^\d+\.\d+\.\d+\.\d+$/.test(dir))
    .sort((a, b) => {
      // Sort by version number (newest first)
      const aVersion = a.split('.').map(n => parseInt(n))
      const bVersion = b.split('.').map(n => parseInt(n))

      for (let i = 0; i < 4; i++) {
        if (aVersion[i] !== bVersion[i]) {
          return bVersion[i] - aVersion[i]
        }
      }
      return 0
    })

  if (versions.length === 0) {
    throw new Error('No Vivaldi version directories found')
  }

  const latestVersion = versions[0]
  const resourcesPath = path.join(vivaldiBasePath, latestVersion, 'resources', 'vivaldi')

  if (!fs.existsSync(resourcesPath)) {
    throw new Error(`Vivaldi resources directory not found: ${resourcesPath}`)
  }

  console.log(`🔍 Found Vivaldi ${latestVersion}`)
  return {
    version: latestVersion,
    resourcesPath: resourcesPath,
    windowHtmlPath: path.join(resourcesPath, 'window.html'),
  }
}

function checkAndUpdateWindowHtml(windowHtmlPath) {
  if (!fs.existsSync(windowHtmlPath)) {
    throw new Error(`window.html not found: ${windowHtmlPath}`)
  }

  const content = fs.readFileSync(windowHtmlPath, 'utf8')
  const scriptTag = '<script src="./custom.js"></script>'

  // Check if script tag already exists
  if (content.includes(scriptTag)) {
    console.log('✅ window.html already contains custom.js script tag')
    return false
  }

  // Add script tag before closing </body> tag
  const updatedContent = content.replace('</body>', `  ${scriptTag}\n</body>`)

  // Backup original first
  const backupPath = windowHtmlPath + '.backup.' + Date.now()
  fs.copyFileSync(windowHtmlPath, backupPath)
  console.log(`📋 Backed up window.html to: ${path.basename(backupPath)}`)

  // Write updated content
  fs.writeFileSync(windowHtmlPath, updatedContent, 'utf8')
  console.log('✅ Updated window.html with custom.js script tag')
  return true
}

function deployToVivaldi() {
  try {
    // Build file path
    const DIST_FILE = path.resolve(__dirname, '../dist/custom.js')

    // Check if build file exists
    if (!fs.existsSync(DIST_FILE)) {
      console.error('❌ Build file not found. Run "npm run build" first.')
      process.exit(1)
    }

    // Auto-detect Vivaldi installation
    const vivaldi = findVivaldiInstallation()
    const TARGET_FILE = path.join(vivaldi.resourcesPath, 'custom.js')

    // **CRITICAL: Check and update window.html**
    const windowHtmlUpdated = checkAndUpdateWindowHtml(vivaldi.windowHtmlPath)

    // Backup existing custom.js if it exists
    if (fs.existsSync(TARGET_FILE)) {
      const backupFile = TARGET_FILE + '.backup.' + Date.now()
      fs.copyFileSync(TARGET_FILE, backupFile)
      console.log(`📋 Backed up existing custom.js to: ${path.basename(backupFile)}`)
    }

    // Copy new file
    fs.copyFileSync(DIST_FILE, TARGET_FILE)
    console.log(`✅ Successfully deployed custom.js to Vivaldi ${vivaldi.version}`)
    console.log(`   Target: ${TARGET_FILE}`)

    if (windowHtmlUpdated) {
      console.log(`\n🔄 window.html was updated. Restart Vivaldi to apply changes.`)
    } else {
      console.log(`\n🔄 Restart Vivaldi to apply changes.`)
    }
  } catch (error) {
    console.error('❌ Deployment failed:', error.message)
    process.exit(1)
  }
}

// Run deployment
deployToVivaldi()
