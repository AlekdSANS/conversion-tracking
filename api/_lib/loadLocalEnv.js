import fs from 'node:fs'
import path from 'node:path'

export function loadLocalEnv() {
  if (process.env.NODE_ENV === 'production') {
    return
  }

  const envPath = path.join(process.cwd(), '.env.local')

  if (!fs.existsSync(envPath)) {
    return
  }

  const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/)

  lines.forEach((line) => {
    const trimmedLine = line.trim()

    if (!trimmedLine || trimmedLine.startsWith('#')) {
      return
    }

    const separatorIndex = trimmedLine.indexOf('=')

    if (separatorIndex === -1) {
      return
    }

    const key = trimmedLine.slice(0, separatorIndex).trim()
    const value = trimmedLine.slice(separatorIndex + 1).trim()

    if (key && !process.env[key]) {
      process.env[key] = value
    }
  })
}
