import { chromium, expect } from '@playwright/test'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { commitmentOracle, observeGrowingV8, summarizeGrowingV8 } from './growing-skeleton-v8-observer.mjs'
import { MATERIAL, RAW, hash, fingerprint, implementationSnapshot, archiveGrowingV8 } from './archive-growing-skeleton-v8.mjs'

const url = process.argv[2] ?? 'http://localhost:3000'
const fixtureFile = 'data/traces/compact/weather__random-b32.json', bytes = await readFile(fixtureFile), trace = JSON.parse(bytes)
const oracle = commitmentOracle(trace), implementation = await implementationSnapshot(), startedAt = new Date().toISOString()
const contract = { material: MATERIAL, fingerprint: fingerprint(implementation), source: trace.id, expectedText: trace.answer, oracle }
const browser = await chromium.launch(), results = []
await mkdir(RAW, { recursive: true })
try {
  for (const width of [390, 1380]) for (const policy of ['answer', 'sentence']) {
    const viewport = { width, height: width === 390 ? 844 : 900 }, name = `${width}-${policy}`
    const context = await browser.newContext({ viewport, reducedMotion: 'no-preference' })
    try {
      const page = await context.newPage(), errors = []
      page.on('pageerror', (error) => errors.push(error.message))
      await page.goto(url, { waitUntil: 'networkidle' }); await page.evaluate(() => document.fonts.ready)
      const stage = page.locator('#playground')
      await stage.getByRole('radiogroup', { name: 'sampler', exact: true }).getByRole('radio', { name: 'random · 4 blocks', exact: true }).click()
      await stage.getByRole('radiogroup', { name: 'Prompt', exact: true }).getByRole('radio', { name: trace.prompt, exact: true }).click()
      await stage.getByRole('radio', { name: policy === 'answer' ? 'whole answer' : 'each sentence', exact: true }).click()
      await stage.getByRole('radio', { name: 'recorded', exact: true }).click()
      const surface = stage.locator('.settle').first()
      await surface.scrollIntoViewIfNeeded(); await expect(surface).toHaveAttribute('data-visible', 'true')
      const raw = await surface.evaluate(observeGrowingV8, { ...contract, name, viewport, policy })
      await writeFile(`${RAW}/${name}.json`, JSON.stringify(raw))
      if (errors.length) throw Error(`Browser errors: ${errors.join('; ')}`)
      const summary = summarizeGrowingV8(raw); results.push(summary); console.log(JSON.stringify(summary))
    } finally { await context.close() }
  }
  await archiveGrowingV8({ schemaVersion: 1, material: MATERIAL, fingerprint: contract.fingerprint, implementation, fixture: { file: fixtureFile, id: trace.id, sha256: hash(bytes) },
    startedAt, observedAt: new Date().toISOString(), browser: 'Chromium', browserVersion: browser.version(), url, results,
    method: 'Four sequential focused observations: one original unedited recorded source, whole-answer and sentence policies, at390×844 and1380×900. The source runs at its original recorded forward-pass clock. An independent fixture oracle reconstructs committed prefixes and finality; existing corpus tests separately verify exact policy segmentation. rAF geometry records newly released ink, actual captured cells, remaining field and final rest.',
    caveats: ['Emulated viewports, not physical devices.', 'No reader preference, dopamine, speed improvement or device-FPS claim.', 'Raw samples are instrumented observations, not passive presentation recordings.', 'Source eligibility, ink opacity and settled readiness are distinct browser milestones.'] })
} finally { await browser.close() }
