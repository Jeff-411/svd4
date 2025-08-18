<!-- docs/update-handler-v1/explainers/handling-vivaldi-updates.md - v1 -->

# Handling Vivaldi Updates: Complete Code Flow Analysis

This document provides a detailed step-by-step analysis of what happens when you run `./scripts/update-handler/start-vivaldi-monitor.bat` and how the entire Vivaldi update handling system works.

## Overview

The system consists of multiple interconnected components that work together to detect Vivaldi updates and automatically re-inject custom JavaScript modifications:

- **Batch Script**: [`scripts/update-handler/start-vivaldi-monitor.bat`](../../scripts/update-handler/start-vivaldi-monitor.bat)
- **Monitor Process**: [`scripts/update-handler/vivaldi-monitor.js`](../../scripts/update-handler/vivaldi-monitor.js)
- **Notification System**: [`scripts/update-handler/browser-notifications.js`](../../scripts/update-handler/browser-notifications.js)
- **Server Backend**: [`scripts/update-handler/notification-server.js`](../../scripts/update-handler/notification-server.js)
- **User Interface**: [`notifications/user-notification.html`](../../notifications/user-notification.html)

## Step-by-Step Code Flow Analysis

### Phase 1: Initial Startup

#### Step 1: Batch File Execution

```batch
# User runs this command in project root
./scripts/update-handler/start-vivaldi-monitor.bat
```

**What happens:**

1. **Directory Navigation**: The `/d` parameter ensures the script changes to the correct drive and directory
2. **Background Process**: `start /min` launches the Node.js process in a minimized window
3. **Process Persistence**: The monitor runs independently of the terminal session

**Key Code:**

```batch
cd /d "C:\Users\johnj\OneDrive\SEE_VIVALDI\see-vivaldi"
start /min node scripts/update-handler/vivaldi-monitor.js
```

#### Step 2: Monitor Initialization

**File**: [`scripts/update-handler/vivaldi-monitor.js`](../../scripts/update-handler/vivaldi-monitor.js)

**Constructor Setup:**

```javascript
constructor() {
  this.lastKnownVersion = null
  this.watcher = null
  this.notificationServer = null
  this.monitorPath = this.getVivaldiBasePath()
}
```

**Path Detection:**

```javascript
getVivaldiBasePath() {
  const username = os.userInfo().username
  return `C:/Users/${username}/AppData/Local/Vivaldi/Application`
}
```

#### Step 3: Version Detection and File System Monitoring

```javascript
initialize() {
  // Get initial version
  const currentVersionInfo = getLatestVivaldiVersion()
  if (currentVersionInfo) {
    this.lastKnownVersion = currentVersionInfo.version
    console.log(`🔍 Initial Vivaldi version: ${this.lastKnownVersion}`)
  }

  // Start monitoring
  this.startMonitoring()
  return true
}
```

**File System Watcher:**

```javascript
startMonitoring() {
  this.watcher = fs.watch(this.monitorPath, { persistent: true }, (eventType, filename) => {
    if (eventType === 'rename' && filename) {
      // Check if it's a new version directory
      if (/^\d+\.\d+\.\d+\.\d+$/.test(filename)) {
        console.log(`📁 Detected potential version change: ${filename}`)
        this.handlePotentialVersionChange(filename)
      }
    }
  })
}
```

### Phase 2: Version Change Detection

#### Step 4: Version Comparison Logic

```javascript
handlePotentialVersionChange(newVersionDir) {
  setTimeout(() => {
    const currentVersionInfo = getLatestVivaldiVersion()

    if (currentVersionInfo && currentVersionInfo.version !== this.lastKnownVersion) {
      const versionChange = {
        previous: this.lastKnownVersion,
        current: currentVersionInfo.version,
      }

      if (isVersionNewer(currentVersionInfo.version, this.lastKnownVersion)) {
        console.log(`🚨 Vivaldi Update Detected: ${this.lastKnownVersion} → ${currentVersionInfo.version}`)
        this.handleVersionChange(versionChange)
        this.lastKnownVersion = currentVersionInfo.version
      }
    }
  }, 2000) // Wait 2 seconds for directory to stabilize
}
```

**Critical Logic Points:**

- **Directory Stability**: 2-second delay ensures the new version directory is fully created
- **Version Comparison**: Only triggers on newer versions to avoid false positives
- **State Update**: Updates `lastKnownVersion` to prevent repeated notifications

### Phase 3: Notification System Activation

#### Step 5: Notification Server Startup

```javascript
handleVersionChange(versionChange) {
  console.log('🚨 Vivaldi Update Detected!')
  console.log(`   Version: ${versionChange.previous} → ${versionChange.current}`)

  // Start notification server for communication
  this.startNotificationServer()

  // Show notification as regular tab
  const notificationShown = showVivaldiUpdateNotification(versionChange)
}
```

**Server Initialization:**

```javascript
startNotificationServer() {
  if (!this.notificationServer) {
    this.notificationServer = new NotificationServer()
    this.notificationServer.start()
    console.log('🔧 Notification server started for HTML communication')
  }
  return this.notificationServer
}
```

#### Step 6: Browser Notification Creation

**File**: [`scripts/update-handler/browser-notifications.js`](../../scripts/update-handler/browser-notifications.js)

```javascript
function showVivaldiUpdateNotification(versionChange) {
  console.log('📢 Displaying accessible update notification...')
  console.log(`   Previous version: ${versionChange.previous}`)
  console.log(`   Current version: ${versionChange.current}`)

  // Update HTML template with version information
  updateNotificationHtml(notificationFilePath, versionChange)

  // Open in Vivaldi as a regular tab
  return openInVivaldi(notificationFilePath)
}
```

**HTML Template Update:**

```javascript
function updateNotificationHtml(filePath, versionChange) {
  let htmlContent = fs.readFileSync(filePath, 'utf8')

  // Replace placeholder values with actual version data
  htmlContent = htmlContent.replace(
    /const previousVersion = 'Unknown'/g,
    `const previousVersion = '${versionChange.previous}'`
  )

  htmlContent = htmlContent.replace(
    /const currentVersion = 'Unknown'/g,
    `const currentVersion = '${versionChange.current}'`
  )

  fs.writeFileSync(filePath, htmlContent, 'utf8')
}
```

### Phase 4: User Interface Display

#### Step 7: Vivaldi Tab Creation

```javascript
function openInVivaldi(filePath) {
  try {
    console.log('🌐 Opening notification in Vivaldi (as tab)...')
    console.log(`   File: ${filePath}`)

    // Use Vivaldi to open the file as a regular tab
    execSync(`"${findVivaldiBrowser()}" "${filePath}"`, {
      stdio: 'ignore',
      windowsHide: true,
    })

    console.log('✅ Notification opened as tab in Vivaldi')
    return true
  } catch (error) {
    console.error('❌ Failed to open notification in Vivaldi:', error.message)
    return false
  }
}
```

#### Step 8: HTML Interface Initialization

**File**: [`notifications/user-notification.html`](../../notifications/user-notification.html)

```javascript
// Initialize version display
const previousVersion = '7.5.3735.56' // Updated by updateNotificationHtml
const currentVersion = '7.5.3735.58' // Updated by updateNotificationHtml

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('previous-version').textContent = previousVersion
  document.getElementById('current-version').textContent = currentVersion
})
```

### Phase 5: Auto-Deployment Process

#### Step 9: User Interaction - Auto-Deploy Button

```javascript
async function startAutoDeployment() {
  try {
    // Disable buttons and show progress
    document.querySelectorAll('.btn').forEach(btn => (btn.disabled = true))
    progressFill.style.width = '0%'
    statusMessage.textContent = '🚀 Starting auto-deployment...'

    // Call the server's auto-deploy endpoint
    const result = await callNodeScript('auto-deploy')

    if (result.success) {
      statusMessage.textContent = '✅ Deployment initiated! Vivaldi will restart shortly.'
      progressFill.style.width = '100%'
    }
  } catch (error) {
    statusMessage.textContent = `❌ Deployment failed: ${error.message}`
  }
}
```

#### Step 10: Server-Side Auto-Deployment

**File**: [`scripts/update-handler/notification-server.js`](../../scripts/update-handler/notification-server.js)

```javascript
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
```

### Phase 6: Build and Deploy Operations

#### Step 11: Build Process

```javascript
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
```

**Build Process Triggers:**

1. **Webpack Compilation**: Processes source files from `src/`
2. **PostBuild Hook**: Automatically runs `npm run deploy` via package.json configuration
3. **File Deployment**: Copies compiled files to Vivaldi's resources directory

#### Step 12: Vivaldi Process Management

```javascript
async closeVivaldi() {
  try {
    console.log('🔄 Closing Vivaldi...')

    // Graceful shutdown first
    execSync('taskkill /IM vivaldi.exe', {
      stdio: 'ignore',
      windowsHide: true,
    })

    // Force kill if needed
    execSync('taskkill /F /IM vivaldi.exe', {
      stdio: 'ignore',
      windowsHide: true,
    })

    console.log('✅ Vivaldi closed successfully')
    return { success: true, message: 'Vivaldi closed successfully' }
  } catch (error) {
    // Ignore errors - process might already be closed
    console.log('✅ Vivaldi closed successfully')
    return { success: true, message: 'Vivaldi closed successfully' }
  }
}
```

#### Step 13: Vivaldi Restart Process

```javascript
async restartVivaldi() {
  try {
    console.log('🚀 Restarting Vivaldi...')

    // Find Vivaldi executable
    const vivaldiPath = this.findVivaldiBrowser()

    if (!vivaldiPath) {
      throw new Error('Could not find Vivaldi executable')
    }

    console.log(`🔍 Found Vivaldi at: ${vivaldiPath}`)

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
```

## Critical System Components

### File System Monitoring

- **Target Directory**: `C:/Users/{username}/AppData/Local/Vivaldi/Application`
- **Watch Pattern**: Version folders matching `\d+\.\d+\.\d+\.\d+`
- **Event Type**: `rename` events indicating new directory creation
- **Stability Buffer**: 2-second delay to ensure directory is fully created

### Version Detection Logic

- **Source**: Latest subdirectory in Vivaldi Application folder
- **Comparison**: Semantic version comparison using custom `isVersionNewer` function
- **State Management**: Tracks `lastKnownVersion` to prevent duplicate notifications

### Communication Architecture

- **HTTP Server**: Runs on `localhost:3842` for HTML-to-Node.js communication
- **REST Endpoints**: `/build`, `/deploy`, `/close-vivaldi`, `/restart-vivaldi`, `/auto-deploy`
- **CORS Handling**: Allows local cross-origin requests for browser-based interactions

### Process Management

- **Graceful Shutdown**: Attempts normal process termination first
- **Force Termination**: Uses `/F` flag as fallback for stubborn processes
- **Detached Restart**: Spawns Vivaldi process independently to survive parent process termination

## Error Handling and Recovery

### Common Failure Points

1. **Permission Issues**: File system access to Vivaldi directories
2. **Process Conflicts**: Multiple Vivaldi instances or locked files
3. **Network Issues**: Local server communication failures
4. **Build Failures**: npm/webpack compilation errors

### Recovery Mechanisms

- **Automatic Retry**: Some operations include built-in retry logic
- **Fallback Options**: Manual deployment instructions provided on failure
- **Error Logging**: Comprehensive console output for debugging
- **State Reset**: Deployment flags reset on both success and failure

## Performance Considerations

### Resource Usage

- **File System Watcher**: Minimal CPU impact, persistent memory footprint
- **HTTP Server**: Lightweight, only active during update processes
- **Build Process**: High CPU/memory usage during compilation (temporary)

### Timing Optimizations

- **Directory Stabilization**: 2-second delay prevents premature detection
- **Restart Delay**: 3-second pause between close and restart operations
- **Server Startup**: Lazy initialization only when updates are detected

## Security Considerations

### Access Control

- **Local Only**: Server bound to `localhost` interface
- **Process Isolation**: Spawned processes run in user context
- **File Permissions**: Respects existing Vivaldi directory permissions

### Validation

- **Path Validation**: Ensures target directories exist and are accessible
- **Version Format**: Validates version strings match expected pattern
- **Command Injection**: Uses execSync with controlled parameters

## Troubleshooting Guide

### Monitor Not Starting

- **Check Node.js**: Ensure Node.js is installed and in PATH
- **Verify Paths**: Confirm project directory structure
- **Permission Issues**: Run with appropriate user privileges

### Updates Not Detected

- **Vivaldi Location**: Verify installation path matches expected location
- **Directory Permissions**: Ensure read access to Vivaldi Application folder
- **Version Format**: Check that version directories match expected pattern

### Auto-Deploy Failures

- **Build Errors**: Check npm dependencies and webpack configuration
- **Process Conflicts**: Ensure no other processes are modifying Vivaldi files
- **Server Communication**: Verify localhost:3842 is accessible

### Vivaldi Restart Issues

- **Executable Path**: Confirm Vivaldi executable location
- **Process Termination**: Check for lingering Vivaldi processes
- **Resource Conflicts**: Ensure sufficient system resources available

## Testing Scenarios

### Manual Testing Process

1.  **Close Vivaldi**
1.  **Setup**: Decrement Vivaldi version folder to simulate older version
1.  **Start Monitor**: Run batch file to start monitoring (`./scripts/update-handler/start-vivaldi-monitor.bat` )
1.  **Open Vivaldi**
1.  **Trigger Update**: Rename folder back to current version
1.  **Verify Notification**: Confirm HTML notification opens in browser
1.  **Test Auto-Deploy**: Click button and verify complete workflow
1.  **Validate Results**: Confirm custom JavaScript is properly injected

View the detailed manual test protocol [here](../tests/manual-bat-file-test.md).

### Expected Log Output

```
🚀 Starting Vivaldi Update Monitor...
🔍 Initial Vivaldi version: 7.5.3735.56
👀 Monitoring Vivaldi updates at: C:/Users/johnj/AppData/Local/Vivaldi/Application
✅ Vivaldi monitor started
🚀 Vivaldi monitor is running. Press Ctrl+C to stop.
📍 Monitoring: C:/Users/johnj/AppData/Local/Vivaldi/Application
📊 Current version: 7.5.3735.56
📁 Detected potential version change: 7.5.3735.58
🚨 Vivaldi Update Detected: 7.5.3735.56 → 7.5.3735.58
🚨 Vivaldi Update Detected!
   Version: 7.5.3735.56 → 7.5.3735.58
🔧 Notification server started for HTML communication
📢 Displaying accessible update notification...
   Previous version: 7.5.3735.56
   Current version: 7.5.3735.58
📝 Updated notification with version info: 7.5.3735.56 → 7.5.3735.58
🌐 Opening notification in Vivaldi (as tab)...
   File: C:\Users\johnj\OneDrive\SEE_VIVALDI\see-vivaldi\notifications\user-notification.html
✅ Notification opened as tab in Vivaldi
🔧 Notification server running on http://localhost:3842
🚀 Starting full auto-deployment...
📦 Step 1: Building and deploying...
🔨 Running npm run build...
✅ Build completed successfully
🔄 Step 2: Closing Vivaldi...
🔄 Closing Vivaldi...
✅ Vivaldi closed successfully
⏳ Step 3: Waiting before restart...
🚀 Step 4: Restarting Vivaldi...
🚀 Restarting Vivaldi...
🔍 Found Vivaldi at: C:/Users/johnj/AppData/Local/Vivaldi/Application/vivaldi.exe
✅ Vivaldi restart initiated
✅ Full auto-deployment completed successfully!
```

## Future Enhancement Opportunities

### Potential Improvements

1. **Multi-User Support**: Handle multiple user profiles on same machine
2. **Configuration Management**: Allow customization of paths and settings
3. **Update Scheduling**: Support for delayed or scheduled deployments
4. **Backup Management**: Automatic backup of working configurations
5. **Rollback Capability**: Ability to revert to previous working state

### Integration Possibilities

1. **Windows Services**: Convert to service for automatic startup
2. **System Tray**: Add system tray interface for status monitoring
3. **Logging Framework**: Implement structured logging with log rotation
4. **Update Notifications**: Email or system notifications for update events
5. **Remote Management**: Web interface for monitoring multiple installations

This comprehensive analysis demonstrates how the Vivaldi update handling system provides a robust, automated solution for maintaining custom JavaScript injections across browser updates while ensuring reliable operation and user-friendly interaction.
