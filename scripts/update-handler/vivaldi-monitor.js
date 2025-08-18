// scripts/vivaldi-monitor.js - v2

const fs = require('fs')
const os = require('os')
const { showVivaldiUpdateNotification } = require('./browser-notifications.js')
const { NotificationServer } = require('./notification-server.js')
const { getLatestVivaldiVersion, isVersionNewer } = require('./version-detection.js')

/**
 * Monitors Vivaldi installation for version changes and triggers notifications
 * Compatible with browser-notifications.js v3 (Option 3 Enhanced)
 */

class VivaldiMonitor {
  constructor() {
    this.lastKnownVersion = null
    this.watcher = null
    this.notificationServer = null
    this.monitorPath = this.getVivaldiBasePath()
  }

  getVivaldiBasePath() {
    const username = os.userInfo().username
    return `C:/Users/${username}/AppData/Local/Vivaldi/Application`
  }

  initialize() {
    // Get initial version
    const currentVersionInfo = getLatestVivaldiVersion()
    if (currentVersionInfo) {
      this.lastKnownVersion = currentVersionInfo.version
      console.log(`🔍 Initial Vivaldi version: ${this.lastKnownVersion}`)
    } else {
      console.log('⚠️  No Vivaldi installation found')
      return false
    }

    // Start monitoring
    this.startMonitoring()
    return true
  }

  startMonitoring() {
    if (!fs.existsSync(this.monitorPath)) {
      console.error(`❌ Vivaldi application directory not found: ${this.monitorPath}`)
      return false
    }

    console.log(`👀 Monitoring Vivaldi updates at: ${this.monitorPath}`)

    // Watch for new directories (version folders)
    this.watcher = fs.watch(this.monitorPath, { persistent: true }, (eventType, filename) => {
      if (eventType === 'rename' && filename) {
        // Check if it's a new version directory
        if (/^\d+\.\d+\.\d+\.\d+$/.test(filename)) {
          console.log(`📁 Detected potential version change: ${filename}`)
          this.handlePotentialVersionChange(filename)
        }
      }
    })

    console.log('✅ Vivaldi monitor started')
    return true
  }

  handlePotentialVersionChange(newVersionDir) {
    // Wait a moment for directory to be fully created
    setTimeout(() => {
      const currentVersionInfo = getLatestVivaldiVersion()

      if (currentVersionInfo && currentVersionInfo.version !== this.lastKnownVersion) {
        const versionChange = {
          previous: this.lastKnownVersion,
          current: currentVersionInfo.version,
        }

        if (isVersionNewer(currentVersionInfo.version, this.lastKnownVersion)) {
          console.log(
            `🚨 Vivaldi Update Detected: ${this.lastKnownVersion} → ${currentVersionInfo.version}`
          )
          this.handleVersionChange(versionChange)
          this.lastKnownVersion = currentVersionInfo.version
        }
      }
    }, 2000) // Wait 2 seconds for directory to stabilize
  }

  handleVersionChange(versionChange) {
    console.log('🚨 Vivaldi Update Detected!')
    console.log(`   Version: ${versionChange.previous} → ${versionChange.current}`)

    // Start notification server for communication
    this.startNotificationServer()

    // Show notification as regular tab (Option 3 Enhanced)
    const notificationShown = showVivaldiUpdateNotification(versionChange)

    if (!notificationShown) {
      console.warn('⚠️  Could not show notification tab, falling back to console')
      console.log('💡 Manual deployment needed:')
      console.log('   npm run build && npm run deploy')
      console.log('   or run: post-vivaldi-update.bat')
    }
  }

  startNotificationServer() {
    if (!this.notificationServer) {
      this.notificationServer = new NotificationServer()
      this.notificationServer.start()
      console.log('🔧 Notification server started for HTML communication')
    }
    return this.notificationServer
  }

  stop() {
    console.log('🔄 Shutting down monitor...')

    if (this.notificationServer) {
      this.notificationServer.stop()
    }

    if (this.watcher) {
      this.watcher.close()
      console.log('📁 File system watcher stopped')
    }

    console.log('✅ Monitor stopped')
  }

  getStatus() {
    return {
      isRunning: this.watcher !== null,
      currentVersion: this.lastKnownVersion,
      monitorPath: this.monitorPath,
      serverRunning: this.notificationServer !== null,
    }
  }
}

// Create and start monitor if run directly
if (require.main === module) {
  console.log('🚀 Starting Vivaldi Update Monitor...')

  const monitor = new VivaldiMonitor()

  if (monitor.initialize()) {
    // Graceful shutdown handlers
    process.on('SIGINT', () => {
      console.log('\n🔄 Received shutdown signal...')
      monitor.stop()
      process.exit(0)
    })

    process.on('SIGTERM', () => {
      console.log('\n🔄 Received termination signal...')
      monitor.stop()
      process.exit(0)
    })

    // Handle uncaught exceptions gracefully
    process.on('uncaughtException', error => {
      console.error('❌ Uncaught exception:', error.message)
      monitor.stop()
      process.exit(1)
    })

    console.log('🚀 Vivaldi monitor is running. Press Ctrl+C to stop.')
    console.log(`📍 Monitoring: ${monitor.monitorPath}`)
    console.log(`📊 Current version: ${monitor.lastKnownVersion}`)
  } else {
    console.error('❌ Failed to initialize monitor')
    process.exit(1)
  }
}

module.exports = { VivaldiMonitor }
