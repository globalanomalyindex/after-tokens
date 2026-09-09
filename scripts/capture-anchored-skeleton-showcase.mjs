import { chromium, expect } from '@playwright/test'
import { mkdir, readFile, writeFile, access } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { capturedClock } from './measure-anchored-skeleton-motion.mjs'
import { SKELETON_MATERIAL, SKELETON_REPORT, skeletonHash, skeletonImplementationSnapshot } from './archive-anchored-skeleton-motion.mjs'

// These passive recordings are presentation artifacts, separate from the
// exhaustive geometry observations and their instrumented videos.
const root = process.cwd(), url = process.argv[2] ?? 'http://localhost:3000'
const report = JSON.parse(await readFile(path.join(root, SKELETON_REPORT)))
const implementation = await skeletonImplementationSnapshot(root)
if (report.material !== SKELETON_MATERIAL || report.results.length !== 8 || JSON.stringify(report.implementation) !== JSON.stringify(implementation)) throw Error('Expected eight observations of this unchanged implementation before a showcase capture')
const manifestPath = 'docs/anchored-skeleton-showcase-capture-2026-09-09.json'
const artifacts = 'output/playwright/anchored-skeleton-showcase-2026-09-09'
const cases = [
  { name: 'mobile', label: 'a numbered list', source: 'sleep-tips__lowconf-b128-s32', file: 'data/experiments/parallel-qwen-2026-09-09/compact/sleep-tips__lowconf-b128-s32.json' },
  { name: 'long', label: 'an explanation', source: 'sky-blue__lowconf-b128-s32', file: 'data/experiments/parallel-qwen-2026-09-09/compact/sky-blue__lowconf-b128-s32.json' },
].map((item) => ({ ...item, destination: `public/study/anchored-skeleton-showcase-${item.name}.webm` }))
for (const file of [manifestPath, ...cases.map((item) => item.destination)]) {
  try { await access(path.join(root, file)) } catch (error) { if (error.code === 'ENOENT') continue; throw error }
  throw Error(`Refusing to overwrite an existing showcase artifact: ${file}`)
}
await mkdir(path.join(root, artifacts), { recursive: true })
const browser = await chromium.launch(), recordings = [], pending = []
try {
  if (browser.version() !== report.browserVersion) throw Error('Showcase browser differs from the observed browser')
  for (const item of cases) {
    const bytes = await readFile(path.join(root, item.file)), trace = JSON.parse(bytes), sourceHash = skeletonHash(bytes)
    const fixture = report.sourceFixtures.find((entry) => entry.file === item.file)
    if (fixture?.sha256 !== sourceHash || trace.id !== item.source) throw Error(`Showcase source differs: ${item.source}`)
    const clock = capturedClock(trace, .5), viewport = { width: 390, height: 844 }, recordedAt = new Date().toISOString()
    const context = await browser.newContext({ viewport, reducedMotion: 'no-preference', recordVideo: { dir: path.join(root, artifacts), size: viewport } })
    try {
      const page = await context.newPage(), errors = []
      page.on('pageerror', (error) => errors.push(error.message))
      await page.goto(url, { waitUntil: 'networkidle' })
      await page.evaluate(() => document.fonts.ready)
      const study = page.locator('.ambient-study')
      await study.getByRole('radiogroup', { name: 'recording', exact: true }).getByRole('radio', { name: item.label, exact: true }).click()
      await expect(study).toHaveAttribute('data-source-id', trace.id)
      await study.getByRole('radiogroup', { name: 'clock', exact: true }).getByRole('radio', { name: '0.5× inspection', exact: true }).click()
      await study.getByRole('radiogroup', { name: 'motion study', exact: true }).getByRole('radio', { name: 'reshape', exact: true }).click()
      const surface = study.locator('.settle[data-ambient-condition="reshape"]')
      await surface.evaluate((element) => element.scrollIntoView({ block: 'center', behavior: 'instant' }))
      await expect(surface).toHaveAttribute('data-visible', 'true')
      // The complete replay runs between these two interactions without a
      // MutationObserver, rAF sampler, geometry reads, or animation polling.
      await study.evaluate((element) => [...element.querySelectorAll('button')].find((button) => button.textContent === 'replay all').click())
      await page.waitForTimeout(clock.effectiveDurationMs + 1250)
      await expect(surface).toHaveAttribute('data-visual-ready', 'true')
      if (await surface.locator('.settle-page').textContent() !== trace.answer || errors.length) throw Error(`Showcase did not end in the exact answer: ${JSON.stringify(errors)}`)
      const video = page.video()
      await context.close()
      const artifact = `${artifacts}/${item.name}.webm`
      await video.saveAs(path.join(root, artifact))
      const videoBytes = await readFile(path.join(root, artifact))
      if (videoBytes.subarray(0, 4).toString('hex') !== '1a45dfa3') throw Error('Showcase is not a WebM container')
      pending.push({ file: item.destination, bytes: videoBytes })
      recordings.push({ name: item.name, recordedAt, source: trace.id, sourceFile: item.file, sourceSha256: sourceHash, clock, viewport, condition: 'reshape', file: item.destination, url: item.destination.replace(/^public\//, ''), sha256: skeletonHash(videoBytes), bytes: videoBytes.length, artifact, exactFinalText: true })
      console.log(JSON.stringify({ captured: item.name, source: trace.id, file: item.destination, sha256: skeletonHash(videoBytes) }))
    } finally { await context.close() }
  }
  if (JSON.stringify(await skeletonImplementationSnapshot(root)) !== JSON.stringify(implementation)) throw Error('Implementation changed during showcase capture')
  for (const item of pending) await writeFile(path.join(root, item.file), item.bytes)
  const manifest = {
    schemaVersion: 1, recordedAt: new Date().toISOString(), material: SKELETON_MATERIAL,
    implementationFingerprint: report.fingerprint, implementation, measuredReport: SKELETON_REPORT,
    captureScript: { file: path.relative(root, fileURLToPath(import.meta.url)), sha256: skeletonHash(await readFile(fileURLToPath(import.meta.url))) },
    browser: 'Chromium', browserVersion: browser.version(), url, recordings,
    method: 'Separate passive Playwright browser videos. Fonts and controls are prepared first; a full replay then runs without frame sampling, MutationObserver, geometry reads, or animation polling. Exact final text is checked after the replay. The untrimmed browser videos retain initial page loading, setup and scrolling. No generated or interpolated frames and no edited answer text.',
    sourceClock: 'Explicitly selected 0.5× inspection of original observed capture-loop intervals. Decorative timing remains unchanged. These are source replays, not live inference or end-to-end request latency.',
    relationshipToMeasurement: 'Same frozen implementation, source bytes and Chromium version as the separate eight-case geometry report. These videos are presentation captures, not the instrumented observations; their different file paths and hashes preserve that distinction.',
    caveats: ['Emulated narrow browser viewport, not a physical iPhone.', 'No device-FPS, performance, reader-benefit, preference or latency-improvement claim.'],
  }
  await writeFile(path.join(root, manifestPath), JSON.stringify(manifest, null, 2) + '\n')
  console.log(JSON.stringify({ manifest: manifestPath, recordings: recordings.length }))
} finally { await browser.close() }
