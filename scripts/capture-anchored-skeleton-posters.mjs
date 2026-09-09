import { chromium } from '@playwright/test'
import { readFile, writeFile, access } from 'node:fs/promises'
import { createHash } from 'node:crypto'

// Decode an actual frame from each verified, untrimmed showcase recording.
// Posters improve the paused presentation without altering the source videos.
const hash = (bytes) => createHash('sha256').update(bytes).digest('hex')
const manifest = JSON.parse(await readFile('docs/anchored-skeleton-showcase-capture-2026-09-09.json'))
const destination = 'docs/anchored-skeleton-showcase-posters-2026-09-09.json'
const files = manifest.recordings.map((recording) => `public/study/anchored-skeleton-showcase-${recording.name}.png`)
for (const file of [destination, ...files]) {
  try { await access(file) } catch (error) { if (error.code === 'ENOENT') continue; throw error }
  throw Error(`Refusing to overwrite an existing poster artifact: ${file}`)
}
const browser = await chromium.launch(), posters = []
try {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
  for (const [index, recording] of manifest.recordings.entries()) {
    const video = await readFile(recording.file)
    if (hash(video) !== recording.sha256) throw Error('Source video differs from its recorded hash')
    await page.setContent(`<style>body{margin:0}video{display:block;width:390px;height:844px}</style><video muted src="data:video/webm;base64,${video.toString('base64')}"></video>`)
    const element = page.locator('video')
    await element.evaluate((video) => new Promise((resolve) => { if (video.readyState >= 2) resolve(); else video.onloadeddata = resolve }))
    await element.evaluate((video) => new Promise((resolve) => { video.onseeked = resolve; video.currentTime = 5 }))
    const bytes = await element.screenshot({ path: files[index] })
    posters.push({ file: files[index], bytes: bytes.length, sha256: hash(bytes), source: recording.file, sourceSha256: recording.sha256, seekSeconds: 5, width: 390, height: 844 })
  }
  await writeFile(destination, JSON.stringify({ schemaVersion: 1, capturedAt: new Date().toISOString(), material: manifest.material, implementationFingerprint: manifest.implementationFingerprint, browser: 'Chromium', browserVersion: browser.version(), method: 'Unedited browser-decoded frame at a 5-second seek in each verified source video. PNG posters only; original videos and their timings remain unchanged.', captureScript: { file: 'scripts/capture-anchored-skeleton-posters.mjs', sha256: hash(await readFile('scripts/capture-anchored-skeleton-posters.mjs')) }, posters }, null, 2) + '\n')
  console.log(JSON.stringify({ destination, posters }))
} finally { await browser.close() }
