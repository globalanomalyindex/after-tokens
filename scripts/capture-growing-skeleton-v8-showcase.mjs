import { chromium, expect } from '@playwright/test'
import { readFile, writeFile, mkdir, access } from 'node:fs/promises'
import { MATERIAL, REPORT, implementationSnapshot, fingerprint, hash } from './archive-growing-skeleton-v8.mjs'
import { commitmentOracle } from './growing-skeleton-v8-observer.mjs'

const base = process.argv[2] ?? 'http://localhost:3000'
const measured = JSON.parse(await readFile(REPORT)), implementation = await implementationSnapshot()
if (fingerprint(implementation) !== measured.fingerprint || measured.results.length !== 4 || measured.results.some((result) => !result.guards.passed)) throw Error('Capture requires four passing observations of unchanged v8 code')
const sourceBytes = await readFile(measured.fixture.file), trace = JSON.parse(sourceBytes), oracle = commitmentOracle(trace)
if (hash(sourceBytes) !== measured.fixture.sha256) throw Error('Source changed')
const manifestPath = 'docs/growing-skeleton-v8-showcase-capture-2026-09-12.json'
const directory = 'output/playwright/growing-skeleton-v8-showcase-2026-09-12'
const cases = [{ name: 'sentence-mobile', policy: 'sentence', viewport: { width: 390, height: 844 } }, { name: 'answer-wide', policy: 'answer', viewport: { width: 1380, height: 900 } }]
for (const file of [manifestPath, ...cases.flatMap((item) => ['webm', 'png'].map((ext) => `public/study/growing-skeleton-v8-showcase-${item.name}.${ext}`))]) {
  try { await access(file) } catch (error) { if (error.code === 'ENOENT') continue; throw error }
  throw Error(`Refusing to overwrite existing capture:${file}`)
}
await mkdir(directory, { recursive: true })
const browser = await chromium.launch(), recordings = [], posters = []
async function prepare(page, item) {
  await page.goto(base, { waitUntil: 'networkidle' }); await page.evaluate(() => document.fonts.ready)
  const stage = page.locator('#playground')
  await stage.getByRole('radiogroup', { name: 'sampler', exact: true }).getByRole('radio', { name: 'random · 4 blocks', exact: true }).click()
  await stage.getByRole('radiogroup', { name: 'Prompt', exact: true }).getByRole('radio', { name: trace.prompt, exact: true }).click()
  await stage.getByRole('radio', { name: item.policy === 'sentence' ? 'each sentence' : 'whole answer', exact: true }).click()
  await stage.getByRole('radio', { name: 'recorded', exact: true }).click()
  const surface = stage.locator('.settle').first()
  await surface.evaluate((root) => root.scrollIntoView({ block: 'center', behavior: 'instant' }))
  await expect(surface).toHaveAttribute('data-visible', 'true')
  return { stage, surface }
}
try {
  if (browser.version() !== measured.browserVersion) throw Error('Capture browser differs from measurement')
  for (const item of cases) {
    const context = await browser.newContext({ viewport: item.viewport, reducedMotion: 'no-preference', recordVideo: { dir: directory, size: item.viewport } })
    try {
      const page = await context.newPage(), errors = []; page.on('pageerror', (error) => errors.push(error.message))
      const { stage, surface } = await prepare(page, item)
      await stage.getByRole('button', { name: 'replay the recording', exact: true }).click()
      // Passive full replay: no frame sampler, observer, geometry reads or
      // animation polling during this interval. The initial setup is retained.
      await page.waitForTimeout(oracle.durationMs + 1300)
      await expect(surface).toHaveAttribute('data-visual-ready', 'true')
      if (await surface.locator('.settle-page').textContent() !== trace.answer || errors.length) throw Error(`Capture did not finish exactly:${errors.join('; ')}`)
      const video = page.video(); await context.close()
      const file = `public/study/growing-skeleton-v8-showcase-${item.name}.webm`; await video.saveAs(file)
      const bytes = await readFile(file)
      recordings.push({ ...item, file, bytes: bytes.length, sha256: hash(bytes), source: trace.id, sourceSha256: hash(sourceBytes), durationMs: oracle.durationMs, playbackScale: 1, exactFinalText: true })
    } finally { await context.close() }
  }
  for (const item of cases) {
    const context = await browser.newContext({ viewport: item.viewport, reducedMotion: 'no-preference' })
    try {
      const page = await context.newPage(), { stage } = await prepare(page, item)
      await stage.getByRole('button', { name: 'replay the recording', exact: true }).click()
      await page.waitForTimeout(item.policy === 'sentence' ? 4700 : 1300)
      const file = `public/study/growing-skeleton-v8-showcase-${item.name}.png`, bytes = await page.screenshot({ path: file })
      posters.push({ ...item, file, bytes: bytes.length, sha256: hash(bytes), method: `Separate browser screenshot approximately ${item.policy === 'sentence' ? 4700 : 1300} ms after replay, not extracted from the passive video.` })
    } finally { await context.close() }
  }
  if (fingerprint(await implementationSnapshot()) !== measured.fingerprint) throw Error('Implementation changed during capture')
  const manifest = { material: MATERIAL, capturedAt: new Date().toISOString(), implementationFingerprint: measured.fingerprint, implementation, measuredReport: REPORT,
    browser: browser.version(), source: measured.fixture, recordings, posters, captureScript: { file: 'scripts/capture-growing-skeleton-v8-showcase.mjs', sha256: hash(await readFile('scripts/capture-growing-skeleton-v8-showcase.mjs')) },
    method: 'Two separate passive untrimmed browser recordings, followed by separate screenshot posters. Same frozen implementation and source as the four focused observations. Setup and scrolling are retained; no sampling during the complete source replay.',
    clock: 'Original recorded forward-pass clock at 1×; decorative timing unchanged. Authored presentation delays are not source or API latency.',
    caveats: ['The mobile viewport is emulated, not a physical iPhone.', 'No reader-benefit or device-performance evidence.'] }
  await writeFile(manifestPath, JSON.stringify(manifest, null, 2) + '\n'); console.log(JSON.stringify({ manifest: manifestPath, recordings, posters }))
} finally { await browser.close() }
