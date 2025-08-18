// scripts/notification-server.js - v5

const http = require('http')
const url = require('url')
const { execSync, spawn } = require('child_process')
const path = require('path')
const fs = require('fs')
const os = require('os')

/**
 * HTTP server for communication between notification HTML and Node.js
 * Enhanced with complete Step 3 automation endpoints and auto-restart
 */

class NotificationServer {
  constructor(port = 3842) {
    this.port = port
    this.server = null
    this.deploymentInProgress = false
  }

  start() {
    if (this.server) {
      console.log('🔧 Notification server already running')
      return this.server
    }

    this.server = http.createServer((req, res) => {
      // CORS headers for local requests
      res.setHeader('Access-Control-Allow-Origin', '*')
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

      if (req.method === 'OPTIONS') {
        res.writeHead(200)
        res.end()
        return
      }

      const parsedUrl = url.parse(req.url, true)
      this.handleRequest(parsedUrl.pathname, parsedUrl.query, req, res)
    })

    this.server.listen(this.port, 'localhost', () => {
      console.log(`🔧 Notification server running on http://localhost:${this.port}`)
    })

    return this.server
  }

  async handleRequest(pathname, params, req, res) {
    try {
      let result = { success: false, message: 'Unknown command' }

      switch (pathname) {
        case '/build':
          result = await this.runBuild()
          break

        case '/deploy':
          result = await this.runDeploy()
          break

        case '/close-vivaldi':
          result = await this.closeVivaldi()
          break

        case '/restart-vivaldi':
          result = await this.restartVivaldi()
          break

        case '/auto-deploy':
          result = await this.runFullAutoDeployment()
          break

        case '/status':
          result = {
            success: true,
            message: 'Server running',
            deploymentInProgress: this.deploymentInProgress,
          }
          break

        default:
          result = { success: false, message: `Unknown endpoint: ${pathname}` }
      }

      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify(result))
    } catch (error) {
      console.error(`❌ Server error on ${pathname}:`, error.message)
      res.writeHead(500, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ success: false, message: error.message }))
    }
  }

  async runBuild() {
    try {
      console.log('🔨 Running npm run build...')
      execSync('npm run build', {
        cwd: path.join(__dirname, '..'),
        stdio: 'pipe',
      })
      console.log('✅ Build completed successfully')
      return { success: true, message: 'Build completed successfully' }
    } catch (error) {
      console.error('❌ Build failed:', error.message)
      return { success: false, message: `Build failed: ${error.message}` }
    }
  }

  async runDeploy() {
    try {
      console.log('🚀 Running npm run deploy...')
      execSync('npm run deploy', {
        cwd: path.join(__dirname, '..'),
        stdio: 'pipe',
      })
      console.log('✅ Deployment completed successfully')
      return { success: true, message: 'Deployment completed successfully' }
    } catch (error) {
      console.error('❌ Deployment failed:', error.message)
      return { success: false, message: `Deployment failed: ${error.message}` }
    }
  }

  async closeVivaldi() {
    try {
      console.log('🔄 Closing Vivaldi...')

      // Close Vivaldi gracefully first, then force if needed
      try {
        execSync('taskkill /IM vivaldi.exe', {
          windowsHide: true,
          stdio: 'ignore', // Suppress output completely
        })
        await new Promise(resolve => setTimeout(resolve, 1000))
      } catch (e) {
        // If graceful close fails, force close all processes
        try {
          execSync('taskkill /F /IM vivaldi.exe', {
            windowsHide: true,
            stdio: 'ignore', // Suppress all output including errors
          })
        } catch (forceError) {
          // Suppress individual process errors - they're expected
          if (!forceError.message.includes('not found')) {
            console.log('ℹ️  Some Vivaldi processes required force termination')
          }
        }
      }

      // Wait for processes to fully close
      await new Promise(resolve => setTimeout(resolve, 2000))

      console.log('✅ Vivaldi closed successfully')
      return { success: true, message: 'Vivaldi closed successfully' }
    } catch (error) {
      // If Vivaldi wasn't running, that's actually success
      if (error.message.includes('not found')) {
        console.log('ℹ️  Vivaldi was not running')
        return { success: true, message: 'Vivaldi was not running' }
      }

      console.error('❌ Failed to close Vivaldi:', error.message)
      return { success: false, message: `Failed to close Vivaldi: ${error.message}` }
    }
  }

  /**
   * Find Vivaldi browser executable
   * @returns {string|null} Path to Vivaldi executable or null if not found
   */
  findVivaldiBrowser() {
    const username = os.userInfo().username
    const possiblePaths = [
      `C:/Users/${username}/AppData/Local/Vivaldi/Application/vivaldi.exe`,
      'C:/Program Files/Vivaldi/Application/vivaldi.exe',
      'C:/Program Files (x86)/Vivaldi/Application/vivaldi.exe',
    ]

    for (const vivaldiPath of possiblePaths) {
      if (fs.existsSync(vivaldiPath)) {
        console.log(`🔍 Found Vivaldi at: ${vivaldiPath}`)
        return vivaldiPath
      }
    }

    console.warn('⚠️  Could not find Vivaldi executable in standard locations')
    return null
  }

  async restartVivaldi() {
    try {
      console.log('🚀 Restarting Vivaldi...')

      // Find Vivaldi executable using our own method
      const vivaldiPath = this.findVivaldiBrowser()

      if (!vivaldiPath) {
        throw new Error('Could not find Vivaldi executable')
      }

      // Start Vivaldi in detached mode
      const vivaldiProcess = spawn(vivaldiPath, [], {
        detached: true,
        stdio: 'ignore',
      })

      vivaldiProcess.unref()

      console.log('✅ Vivaldi restart initiated')
      return { success: true, message: 'Vivaldi restart initiated' }
    } catch (error) {
      console.error('❌ Failed to restart Vivaldi:', error.message)
      return { success: false, message: `Restart failed: ${error.message}` }
    }
  }

  async runFullAutoDeployment() {
    if (this.deploymentInProgress) {
      return { success: false, message: 'Deployment already in progress' }
    }

    this.deploymentInProgress = true

    try {
      console.log('🚀 Starting full auto-deployment...')

      // Step 1: Build (includes deploy via postbuild hook)
      console.log('📦 Step 1: Building and deploying...')
      const buildResult = await this.runBuild()
      if (!buildResult.success) {
        throw new Error(`Build failed: ${buildResult.message}`)
      }

      // Step 2: Close Vivaldi
      console.log('🔄 Step 2: Closing Vivaldi...')
      const closeResult = await this.closeVivaldi()
      if (!closeResult.success) {
        throw new Error(`Close failed: ${closeResult.message}`)
      }

      // Step 3: Wait a moment then restart Vivaldi
      console.log('⏳ Step 3: Waiting before restart...')
      await new Promise(resolve => setTimeout(resolve, 3000))

      console.log('🚀 Step 4: Restarting Vivaldi...')
      const restartResult = await this.restartVivaldi()
      if (!restartResult.success) {
        throw new Error(`Restart failed: ${restartResult.message}`)
      }

      console.log('✅ Full auto-deployment completed successfully!')
      this.deploymentInProgress = false

      return {
        success: true,
        message: 'Full auto-deployment completed successfully!',
      }
    } catch (error) {
      console.error('❌ Auto-deployment failed:', error.message)
      this.deploymentInProgress = false
      return {
        success: false,
        message: `Auto-deployment failed: ${error.message}`,
      }
    }
  }

  stop() {
    if (this.server) {
      this.server.close()
      console.log('🔧 Notification server stopped')
    }
  }
}

module.exports = { NotificationServer }
