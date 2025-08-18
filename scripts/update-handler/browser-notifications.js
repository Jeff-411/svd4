// scripts/browser-notifications.js - v3

const { execSync } = require('child_process')
const path = require('path')
const fs = require('fs')

function openNotificationInVivaldi(versionChange) {
  try {
    const notificationPath = path.join(
      __dirname,
      '../..',
      'notifications',
      'user-notification.html'
    )

    // Ensure notification file exists
    if (!fs.existsSync(notificationPath)) {
      throw new Error(`Notification file not found: ${notificationPath}`)
    }

    // Update HTML with version parameters before opening
    updateNotificationHtml(notificationPath, versionChange)

    console.log('🌐 Opening notification in Vivaldi (as tab)...')
    console.log(`   File: ${notificationPath}`)

    // **SOLUTION**: Use Windows start command to simulate double-click
    // This opens file in default browser as a regular tab
    execSync(`start "" "${notificationPath}"`, {
      windowsHide: true,
      shell: true,
    })

    console.log('✅ Notification opened as tab in Vivaldi')
    return true
  } catch (error) {
    console.error('❌ Failed to open notification in Vivaldi:', error.message)
    return false
  }
}

function updateNotificationHtml(filePath, versionChange) {
  // Read the template HTML
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

  // Write updated content
  fs.writeFileSync(filePath, htmlContent, 'utf8')

  console.log(
    `📝 Updated notification with version info: ${versionChange.previous} → ${versionChange.current}`
  )
}

function showVivaldiUpdateNotification(versionChange) {
  console.log('📢 Displaying accessible update notification...')
  console.log(`   Previous version: ${versionChange.previous}`)
  console.log(`   Current version: ${versionChange.current}`)

  return openNotificationInVivaldi(versionChange)
}

module.exports = {
  showVivaldiUpdateNotification,
  openNotificationInVivaldi,
  updateNotificationHtml,
}
