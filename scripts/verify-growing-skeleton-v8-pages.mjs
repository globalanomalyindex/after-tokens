import { chromium, expect } from '@playwright/test'
import { readFile, mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import assert from 'node:assert/strict'
import { commitmentOracle, observeGrowingV8, summarizeGrowingV8 } from './growing-skeleton-v8-observer.mjs'
import { MATERIAL, REPORT, hash, fingerprint, implementationSnapshot } from './archive-growing-skeleton-v8.mjs'

const base = `${(process.env.VERIFY_URL ?? 'http://127.0.0.1:3010/after-tokens/').replace(/\/$/, '')}/`
const destination = process.env.VERIFY_REPORT ?? 'output/playwright/growing-skeleton-v8-pages-verification.json'
const measured = JSON.parse(await readFile(REPORT)), current = await implementationSnapshot()
assert.equal(fingerprint(current), measured.fingerprint, 'Current code differs from measured v8 implementation')
const traceBytes = await readFile(measured.fixture.file), trace = JSON.parse(traceBytes), oracle = commitmentOracle(trace)
assert.equal(hash(traceBytes), measured.fixture.sha256)
const browser = await chromium.launch(), observations = [], errors = [], assetUrls = new Set()
try {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, reducedMotion: 'no-preference' })
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('response', (response) => {
    const url = new URL(response.url())
    if (response.status() >= 400) errors.push(`${response.status()} ${url.href}`)
    if (url.origin === new URL(base).origin && /\.(js|css)$/.test(url.pathname)) assetUrls.add(url.pathname)
  })
  const response = await page.goto(base, { waitUntil: 'networkidle' })
  assert.equal(response.status(), 200)
  assert.equal(await page.locator('link[rel="canonical"]').getAttribute('href'), 'https://globalanomalyindex.github.io/after-tokens/')
  await page.evaluate(() => document.fonts.ready)
  const hero = page.locator('[data-hero-intro]')
  await hero.getByRole('button', { name: 'show welcome', exact: true }).click()
  await expect(hero).toHaveAttribute('data-static', 'true')
  const heroText = await hero.locator('.settle-page').textContent()
  assert.equal(heroText, 'It should look like this.\nWelcome to after tokens.')
  assert.equal(await hero.locator('[data-hero-transcript]').count(), 1)
  const stage = page.locator('#playground')
  await stage.getByRole('radiogroup', { name: 'sampler', exact: true }).getByRole('radio', { name: 'random · 4 blocks', exact: true }).click()
  await stage.getByRole('radiogroup', { name: 'Prompt', exact: true }).getByRole('radio', { name: trace.prompt, exact: true }).click()
  await stage.getByRole('radio', { name: 'recorded', exact: true }).click()
  for (const policy of ['answer', 'sentence']) {
    await stage.getByRole('radio', { name: policy === 'answer' ? 'whole answer' : 'each sentence', exact: true }).click()
    const surface = stage.locator('.settle').first(); await surface.scrollIntoViewIfNeeded(); await expect(surface).toHaveAttribute('data-visible', 'true')
    const raw = await surface.evaluate(observeGrowingV8, { material: MATERIAL, fingerprint: measured.fingerprint, source: trace.id, expectedText: trace.answer, oracle, name: `390-${policy}-served`, policy, viewport: { width: 390, height: 844 } })
    observations.push(summarizeGrowingV8(raw))
  }
  const assetFiles = []
  for (const asset of assetUrls) {
    assert.ok(asset.startsWith('/after-tokens/'))
    const file = `out/${decodeURIComponent(asset.slice('/after-tokens/'.length))}`
    assert.ok(!file.includes('/../'))
    const served = await page.request.get(new URL(asset, base).href), bytes = await served.body(), expected = await readFile(file)
    assert.equal(served.status(), 200); assert.equal(hash(bytes), hash(expected), `Served asset mismatch:${asset}`)
    assetFiles.push({ path: asset, file, status: 200, bytes: bytes.length, sha256: hash(bytes), expectedSha256: hash(expected) })
  }
  const showcase = JSON.parse(await readFile('docs/growing-skeleton-v8-showcase-capture-2026-09-12.json'))
  assert.equal(showcase.implementationFingerprint, measured.fingerprint)
  assert.equal(showcase.recordings.length, 2); assert.equal(showcase.posters.length, 2)
  const showcaseVideos = [], showcasePosters = [], showcasePlayback = []
  for (const recording of showcase.recordings) {
    const name = path.basename(recording.file), received = await page.request.get(new URL(`study/${name}`, base).href)
    const bytes = await received.body(), expected = await readFile(recording.file)
    assert.equal(received.status(), 200); assert.equal(bytes.subarray(0, 4).toString('hex'), '1a45dfa3')
    assert.equal(hash(bytes), recording.sha256); assert.equal(hash(expected), recording.sha256)
    assert.match(received.headers()['content-type'] ?? '', /video\/webm/)
    showcaseVideos.push({ name, status: 200, bytes: bytes.length, sha256: hash(bytes), expectedSha256: recording.sha256, contentType: received.headers()['content-type'] })
    const poster = showcase.posters.find((item) => item.name === recording.name)
    assert.ok(poster)
    const posterName = path.basename(poster.file), posterResponse = await page.request.get(new URL(`study/${posterName}`, base).href)
    const posterBytes = await posterResponse.body(), expectedPoster = await readFile(poster.file)
    assert.equal(posterResponse.status(), 200); assert.equal(posterBytes.subarray(0, 8).toString('hex'), '89504e470d0a1a0a')
    assert.equal(hash(posterBytes), poster.sha256); assert.equal(hash(expectedPoster), poster.sha256)
    showcasePosters.push({ name: posterName, status: 200, bytes: posterBytes.length, sha256: hash(posterBytes), expectedSha256: poster.sha256 })
    const video = page.locator(`video[src$="/${name}"]`)
    await expect(video).toHaveCount(1)
    await expect(video).toHaveAttribute('poster', `/after-tokens/study/${posterName}`)
    assert.equal(await video.evaluate((element) => element.controls && !element.autoplay), true)
    await video.scrollIntoViewIfNeeded()
    await expect.poll(() => video.evaluate((element) => element.readyState), { timeout: 15000 }).toBeGreaterThanOrEqual(1)
    const metadata = await video.evaluate((element) => ({ durationSeconds: element.duration, readyState: element.readyState, mediaError: element.error?.code ?? null, width: element.videoWidth, height: element.videoHeight }))
    assert.equal(metadata.mediaError, null); assert.ok(Number.isFinite(metadata.durationSeconds) && metadata.durationSeconds > 0)
    assert.equal(metadata.width, recording.viewport.width); assert.equal(metadata.height, recording.viewport.height)
    showcasePlayback.push({ name: recording.name, ...metadata })
  }
  assert.ok(assetFiles.length > 0); assert.deepEqual(errors, [])
  assert.equal(fingerprint(await implementationSnapshot()), measured.fingerprint)
  const report = { material: MATERIAL, verifiedAt: new Date().toISOString(), url: base, status: 200, title: await page.title(), implementationFingerprint: measured.fingerprint,
    measuredReport: REPORT, browser: browser.version(), viewport: { width: 390, height: 844 }, source: measured.fixture, observations, assetFiles, showcaseVideos, showcasePosters, showcasePlayback, errors,
    hero: { exactWelcome: true, transcriptCount: 1, authored: true },
    method: 'Fresh served whole-answer and sentence observations at the original recorded source clock; served JavaScript and CSS bytes must exactly match the local export. Authored hero static welcome and transcript checked separately; both passive recordings and screenshot posters are checked against archived hashes, with playback metadata and dimensions verified.',
    caveats: ['Emulated Chromium viewport, not a physical phone.', 'No reader preference or device performance claim.', 'Existing v7 recordings remain historical and are not evidence for v8 behavior.'] }
  await mkdir(path.dirname(destination), { recursive: true }); await writeFile(destination, JSON.stringify(report, null, 2) + '\n')
  console.log(JSON.stringify({ report: destination, assets: assetFiles.length, observations: observations.length, errors }))
} finally { await browser.close() }
