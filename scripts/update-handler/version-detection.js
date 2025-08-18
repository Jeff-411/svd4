// scripts/version-detection.js - v1

const fs = require('fs')
const path = require('path')
const os = require('os')

/**
 * Detect Vivaldi version changes
 */

function findAllVivaldiVersions() {
  const username = os.userInfo().username
  const vivaldiBasePath = `C:/Users/${username}/AppData/Local/Vivaldi/Application`

  if (!fs.existsSync(vivaldiBasePath)) {
    return []
  }

  return fs
    .readdirSync(vivaldiBasePath)
    .filter(dir => /^\d+\.\d+\.\d+\.\d+$/.test(dir))
    .map(version => ({
      version,
      resourcesPath: path.join(vivaldiBasePath, version, 'resources', 'vivaldi'),
      customJsPath: path.join(vivaldiBasePath, version, 'resources', 'vivaldi', 'custom.js'),
      windowHtmlPath: path.join(vivaldiBasePath, version, 'resources', 'vivaldi', 'window.html'),
    }))
    .filter(info => fs.existsSync(info.resourcesPath))
    .sort((a, b) => {
      const aVersion = a.version.split('.').map(n => parseInt(n))
      const bVersion = b.version.split('.').map(n => parseInt(n))

      for (let i = 0; i < 4; i++) {
        if (aVersion[i] !== bVersion[i]) {
          return bVersion[i] - aVersion[i]
        }
      }
      return 0
    })
}

function getLatestVivaldiVersion() {
  const versions = findAllVivaldiVersions()
  return versions.length > 0 ? versions[0] : null
}

function compareVersions(versionA, versionB) {
  const a = versionA.split('.').map(n => parseInt(n))
  const b = versionB.split('.').map(n => parseInt(n))

  for (let i = 0; i < 4; i++) {
    if (a[i] !== b[i]) {
      return a[i] - b[i]
    }
  }
  return 0
}

function isVersionNewer(currentVersion, previousVersion) {
  return compareVersions(currentVersion, previousVersion) > 0
}

module.exports = {
  findAllVivaldiVersions,
  getLatestVivaldiVersion,
  compareVersions,
  isVersionNewer,
}
