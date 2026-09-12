import { chromium, expect } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import assert from 'node:assert/strict'
import { capturedClock, observeAmbientV7, summarizeAmbientV7 } from './measure-ambient-skeleton-v7-motion.mjs'
import { MATERIAL as SKELETON_MATERIAL, REPORT, implementationSnapshot, fingerprint } from './archive-ambient-skeleton-v7-motion.mjs'

// Served-build smoke check, with the same strict v7 material/finality/opacity/rest oracle as
// the separate half-speed observations. This run uses the observed source
// clock at 1× and therefore makes no complete-cycle exposure claim.
const base = `${(process.env.VERIFY_URL ?? 'http://127.0.0.1:3010/after-tokens/').replace(/\/$/, '')}/`
const reportPath = process.env.VERIFY_REPORT ?? 'output/playwright/ambient-skeleton-v7-pages-verification.json'
const sha256 = (bytes) => crypto.createHash('sha256').update(bytes).digest('hex')
const fixtures = [
  { label: 'a numbered list', file: 'data/experiments/parallel-qwen-2026-09-09/compact/sleep-tips__lowconf-b128-s32.json' },
  { label: 'an explanation', file: 'data/experiments/parallel-qwen-2026-09-09/compact/sky-blue__lowconf-b128-s32.json' },
].map((fixture) => {
  const bytes = fs.readFileSync(fixture.file)
  return { ...fixture, trace: JSON.parse(bytes), sha256: sha256(bytes) }
})
const browser = await chromium.launch()
try {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, reducedMotion: 'no-preference' })
  const errors = [], mediaCancellations = [], loadedAssets = new Set()
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('response', (response) => {
    if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`)
    const asset = new URL(response.url())
    if (asset.origin === new URL(base).origin && /\.(js|css)$/.test(asset.pathname)) loadedAssets.add(asset.pathname)
  })
  page.on('requestfailed', (request) => {
    const failure = request.failure()?.errorText ?? 'request failed'
    const isShowcase = ['mobile', 'long'].some((id) => request.url() === new URL(`study/ambient-skeleton-v7-showcase-${id}.webm`, base).href)
    // Chromium can cancel a metadata request after decoding enough data. Keep
    // this diagnostic; separately require decoded metadata, no media error,
    // and an exact full-file download. Every other request failure is fatal.
    if (failure === 'net::ERR_ABORTED' && request.resourceType() === 'media' && isShowcase) mediaCancellations.push({ url: request.url(), error: failure })
    else errors.push(`${failure} ${request.url()}`)
  })
  const response = await page.goto(base, { waitUntil: 'networkidle', timeout: 60000 })
  assert.equal(response?.status(), 200, 'Page did not return HTTP 200')
  assert.equal(await page.title(), 'After Tokens: a skeleton motion study for generated text', 'Stale page title')
  const canonical = await page.locator('link[rel="canonical"]').getAttribute('href')
  assert.equal(canonical, 'https://globalanomalyindex.github.io/after-tokens/', 'Wrong canonical URL')
  const study = page.locator('.ambient-study'), observations = []
  await study.scrollIntoViewIfNeeded()
  await page.evaluate(() => document.fonts.ready)
  for (const fixture of fixtures) {
    await study.getByRole('radiogroup', { name: 'recording', exact: true }).getByRole('radio', { name: fixture.label, exact: true }).click()
    await expect(study).toHaveAttribute('data-source-id', fixture.trace.id)
    await study.getByRole('radiogroup', { name: 'clock', exact: true }).getByRole('radio', { name: 'observed clock', exact: true }).click()
    const surface = study.locator('.settle[data-ambient-condition="reshape"]')
    await surface.scrollIntoViewIfNeeded()
    await page.waitForTimeout(350)
    const clock = capturedClock(fixture.trace, 1)
    const raw = await surface.evaluate(observeAmbientV7, { expectedText: fixture.trace.answer, sourceId: fixture.trace.id, clock, material: SKELETON_MATERIAL, playbackScale: 1 })
    observations.push({ fixture: fixture.file, fixtureSha256: fixture.sha256, ...summarizeAmbientV7(raw, { name: fixture.trace.id, condition: 'reshape', viewport: { width: 390, height: 844 }, source: fixture.trace.id }) })
  }
  const assets = [...new Set([...loadedAssets, ...await page.locator('script[src],link[rel="stylesheet"]').evaluateAll((nodes) => nodes.map((node) => node.getAttribute('src') || node.getAttribute('href')))])]
  assert.ok(assets.length > 0 && assets.every((asset) => asset.startsWith('/after-tokens/')), 'Invalid Pages asset prefix')
  const assetFiles = []
  for (const asset of [...new Set(assets)]) {
    const url = new URL(asset, base)
    const file = `out/${decodeURIComponent(url.pathname.slice('/after-tokens/'.length))}`
    assert.ok(!file.includes('/../'), 'Unsafe exported asset path')
    const received = await page.request.get(url.href), bytes = await received.body(), expected = fs.readFileSync(file)
    assert.equal(received.status(), 200, `Bundle request failed: ${asset}`)
    assert.equal(sha256(bytes), sha256(expected), `Served bundle differs from local export: ${asset}`)
    assetFiles.push({ path: asset, file, status: received.status(), bytes: bytes.length, sha256: sha256(bytes), expectedSha256: sha256(expected) })
  }
  const verifyVideos = async (names) => {
    const checked = []
    for (const name of names) {
      const videoResponse = await page.request.get(new URL(`study/${name}`, base).href), bytes = await videoResponse.body(), expected = fs.readFileSync(`public/study/${name}`)
      assert.equal(videoResponse.status(), 200, `Video request failed: ${name}`)
      assert.equal(bytes.subarray(0, 4).toString('hex'), '1a45dfa3', `Not WebM: ${name}`)
      assert.equal(sha256(bytes), sha256(expected), `Video bytes differ: ${name}`)
      assert.match(videoResponse.headers()['content-type'] ?? '', /video\/webm/, `Wrong video content type: ${name}`)
      checked.push({ name, status: videoResponse.status(), bytes: bytes.length, contentType: videoResponse.headers()['content-type'], sha256: sha256(bytes), expectedSha256: sha256(expected) })
    }
    return checked
  }
  const showcaseVideos = await verifyVideos(['ambient-skeleton-v7-showcase-mobile.webm', 'ambient-skeleton-v7-showcase-long.webm'])
  const showcasePlayback = [], showcasePosters = []
  for (const id of ['mobile', 'long']) {
    const video = page.locator(`[data-showcase-video="${id}"]`)
    await expect(video).toHaveAttribute('src', `/after-tokens/study/ambient-skeleton-v7-showcase-${id}.webm`)
    const posterName = `ambient-skeleton-v7-showcase-${id}.png`
    await expect(video).toHaveAttribute('poster', `/after-tokens/study/${posterName}`)
    const posterResponse = await page.request.get(new URL(`study/${posterName}`, base).href)
    const posterBytes = await posterResponse.body(), expectedPoster = fs.readFileSync(`public/study/${posterName}`)
    assert.equal(posterResponse.status(), 200, `Poster request failed: ${id}`)
    assert.equal(sha256(posterBytes), sha256(expectedPoster), `Poster bytes differ: ${id}`)
    showcasePosters.push({ name: posterName, status: posterResponse.status(), bytes: posterBytes.length, sha256: sha256(posterBytes) })
    assert.equal(await video.evaluate((element) => element.controls && !element.autoplay), true, 'Showcase must offer playback controls without autoplay')
    await expect.poll(() => video.evaluate((element) => element.readyState), { timeout: 15000 }).toBeGreaterThanOrEqual(1)
    const metadata = await video.evaluate((element) => ({ durationSeconds: element.duration, readyState: element.readyState, mediaError: element.error?.code ?? null }))
    assert.equal(metadata.mediaError, null, `Showcase decode failed: ${id}`)
    assert.ok(Number.isFinite(metadata.durationSeconds) && metadata.durationSeconds > 0, `Showcase duration invalid: ${id}`)
    showcasePlayback.push({ id, ...metadata })
  }
  const reference = page.locator('[data-google-reference]'), referenceImages = []
  await reference.scrollIntoViewIfNeeded()
  for (const [id, label] of [['014', '14 · appearing'], ['035', '35 · revising'], ['045', '45 · settled image']]) {
    await reference.getByRole('radio', { name: label, exact: true }).click()
    const relative = `study/google-reference/frame-${id}.jpg`
    await expect(reference.locator('img')).toHaveAttribute('src', `/after-tokens/${relative}`)
    const received = await page.request.get(new URL(relative, base).href)
    const bytes = await received.body(), expected = fs.readFileSync(`public/${relative}`)
    assert.equal(received.status(), 200, `Reference frame ${id} failed`)
    assert.equal(sha256(bytes), sha256(expected), `Reference frame ${id} differs`)
    referenceImages.push({ frame: id, status: received.status(), bytes: bytes.length, sha256: sha256(bytes) })
  }
  // Independent literal for the authored adapter exercise, never a Google
  // transcript or a timing measurement derived from the reference JPEGs.
  const authoredAnswer = `The result is 39.

1. Take the square root: √81 = 9.
2. Multiply: 9 × (2/3) = 6.
3. Square that result: 6² = 36.
4. Subtract: 15 − 3 = 12.
5. Square the denominator: 2² = 4.
6. Divide: 12 ÷ 4 = 3.
7. Add the two parts: 36 + 3 = 39.`
  const exercise = page.locator('[data-snapshot-study]'), protectedAnswer = exercise.locator('.settle')
  await protectedAnswer.scrollIntoViewIfNeeded()
  await exercise.getByRole('button', { name: 'play example', exact: true }).click()
  await expect.poll(() => exercise.locator('[data-snapshot-draft]').textContent(), { timeout: 7000 }).toBe(authoredAnswer)
  await expect(protectedAnswer).toHaveAttribute('data-status', 'receiving')
  assert.equal(await protectedAnswer.locator('.settle-page').textContent(), '', 'A complete-looking candidate leaked before its final signal')
  const candidateRows = await protectedAnswer.locator('.ambient-composition__bar[data-shown="true"]').count()
  assert.equal(candidateRows, 5, 'Current snapshot changed the decorative waiting budget')
  await expect(protectedAnswer).toHaveAttribute('data-visual-ready', 'true', { timeout: 7000 })
  assert.equal(await protectedAnswer.locator('.settle-page').textContent(), authoredAnswer, 'Authored snapshot final text differs')
  const snapshotExercise = { source: 'authored-revisable-snapshots-v1', authoredDurationMs: 4200, completeLookingCandidateHeld: true, candidateRows, exactFinalText: true, finalTextSha256: sha256(Buffer.from(authoredAnswer)) }
  assert.deepEqual(errors, [], 'Browser or HTTP errors occurred')
  const measured = JSON.parse(fs.readFileSync(REPORT)), current = await implementationSnapshot(process.cwd())
  assert.equal(fingerprint(current), measured.fingerprint, 'Served oracle must reference the unchanged measured implementation')
  const report = { implementationFingerprint: measured.fingerprint, measuredReport: REPORT, verifiedAt: new Date().toISOString(), url: base, browser: browser.version(), status: response.status(), title: await page.title(), canonical, material: SKELETON_MATERIAL, viewport: { width: 390, height: 844 }, assetCount: assets.length, assetPrefix: '/after-tokens/', assets, assetFiles,
    observationMethod: 'MutationObserver installed before replay plus requestAnimationFrame; v7 material/source-finality/full-opacity/rest oracle at original source speed, with actual captured-cell transfer and no old renderer. Local full-word rectangles must fit the visible final frame; this is not a raster or whole-screen occlusion audit.',
    sourceClock: 'Observed capture-loop intervals, replayed at original speed; decorative timing is independent. Not live inference or end-to-end request latency.',
    exactFinalAnswers: observations.map((item) => item.source), observations, showcaseVideos, showcasePlayback, showcasePosters, mediaCancellations, referenceImages, snapshotExercise, errors,
    caveats: ['Chromium at an emulated narrow viewport, not physical iPhone testing.', 'Verifies delivered artifacts and behavior, not reader preference or causal motion effects.'] }
  fs.mkdirSync(path.dirname(reportPath), { recursive: true })
  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`)
  console.log(JSON.stringify(report, null, 2))
} finally { await browser.close() }
