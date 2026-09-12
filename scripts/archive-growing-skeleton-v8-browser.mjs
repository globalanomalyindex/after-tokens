import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import assert from 'node:assert/strict'
import { MATERIAL, REPORT, implementationSnapshot, fingerprint, hash } from './archive-growing-skeleton-v8.mjs'

const root = process.cwd(), input = 'output/playwright/growing-skeleton-v8-e2e-2026-09-12.json'
const directory = 'data/experiments/growing-skeleton-v8-browser-2026-09-12'
const reportFile = 'docs/growing-skeleton-v8-browser-validation-2026-09-12.json'
const bytes = await readFile(path.join(root, input)), raw = JSON.parse(bytes)
const provenanceFile = 'output/playwright/growing-skeleton-v8-e2e-provenance-2026-09-12.json'
const provenanceBytes = await readFile(path.join(root, provenanceFile)), provenance = JSON.parse(provenanceBytes)
assert.equal(raw.stats.expected, 72); assert.equal(raw.stats.unexpected, 0); assert.equal(raw.stats.flaky, 0); assert.equal(raw.stats.skipped, 0)
const measured = JSON.parse(await readFile(path.join(root, REPORT)))
assert.equal(fingerprint(await implementationSnapshot(root)), measured.fingerprint)
assert.deepEqual(measured.implementation.filter((item) => !item.file.startsWith('scripts/')), provenance.runtimeImplementation)
const specs = []
function visit(suite) { specs.push(...(suite.specs ?? [])); for (const child of suite.suites ?? []) visit(child) }
for (const suite of raw.suites) visit(suite)
const tests = specs.flatMap((spec) => spec.tests.map((test) => ({ title: spec.title, project: test.projectName, status: test.status, results: test.results })))
assert.equal(tests.length, 72)
assert.ok(tests.every((test) => test.results.length === 1 && test.results[0].status === 'passed'))
await mkdir(path.join(root, directory), { recursive: true })
const stress = [], earlierReading = []
for (const test of tests) for (const attachment of test.results[0].attachments ?? []) {
  if (!['v8-forced-fit-result', 'v8-earlier-reading-result'].includes(attachment.name)) continue
  const body = attachment.body ? Buffer.from(attachment.body, 'base64') : await readFile(attachment.path)
  const result = JSON.parse(body)
  if (attachment.name === 'v8-earlier-reading-result') {
    assert.deepEqual(result.failures, []); assert.ok(result.batches >= 2 && result.distinctPassages >= 2 && result.maximumTransferCells <= 6)
    assert.ok(result.coherentRestSamples > 50 && result.discardedIncoherentSamples / result.restingSamples < .25 && result.maxRestDrift < .05)
    const file = `${directory}/${test.project}-earlier-reading.json`
    await writeFile(path.join(root, file), body)
    earlierReading.push({ project: test.project, file, sha256: hash(body), bytes: body.length, result })
    continue
  }
  assert.deepEqual(result.failures, []); assert.ok(result.fittingFrames > 0 && result.blendFrames > 1 && result.transferFrames > 1)
  assert.equal(result.duration, 280); assert.ok(result.restMovement < .01)
  const file = `${directory}/${test.project}-underallocation.json`
  await writeFile(path.join(root, file), body)
  stress.push({ project: test.project, file, sha256: hash(body), bytes: body.length, result })
}
assert.equal(stress.length, 3)
assert.equal(earlierReading.length, 3)
const archivedRaw = `${directory}/playwright-report.json`
await writeFile(path.join(root, archivedRaw), bytes)
const testFiles = await Promise.all(['a11y', 'ambient-answer', 'hero-intro', 'reduced-motion-full', 'settle-motion', 'snapshot-study'].map(async (name) => {
  const file = `tests/e2e/${name}.spec.ts`; return { file, sha256: hash(await readFile(path.join(root, file))) }
}))
assert.deepEqual(testFiles, provenance.testFiles)
const archivedProvenance = `${directory}/provenance.json`
await writeFile(path.join(root, archivedProvenance), provenanceBytes)
const report = { schemaVersion: 1, material: MATERIAL, archivedAt: new Date().toISOString(), implementationFingerprint: measured.fingerprint, measuredReport: REPORT,
  stats: raw.stats, projects: [...new Set(tests.map((test) => test.project))], testFiles, testHashMethod: 'Runtime and test source hashes captured before the uninterrupted passing run and checked unchanged when archived. The measurement-script fingerprint is recorded separately from the browser runtime provenance.',
  provenance: { file: archivedProvenance, sha256: hash(provenanceBytes), bytes: provenanceBytes.length, runtimeFingerprint: fingerprint(provenance.runtimeImplementation) },
  raw: { file: archivedRaw, sha256: hash(bytes), bytes: bytes.length }, tests: tests.map(({ results, ...test }) => ({ ...test, durationMs: results[0].duration })), stress, earlierReading,
  stressMethod: 'Authored240px-wide underallocation fixture at each browser viewport. Restart to five rows, seek only the decorative intro to950ms, then force the sky recording to its final event. Source-to-full-opacity and source-to-rest are first sampled browser events, not model latency. The separate joined-intro finality test checks intact-capsule fading without cloned slabs.',
  earlierReadingMethod: 'Ten-second real source replay covers at least two released sentence batches. Settled glyphs are compared with their first coherent baseline relative to the reading page. Samples whose page origin changes during geometry reads are counted and excluded from that geometry comparison; more than50 coherent samples and fewer than25% incoherent samples are required. Absolute viewport glyph movement and within-sample scroll changes remain separate diagnostics, not claims of zero on-screen movement.',
  caveats: ['Browser projects include an emulated iPhone viewport, not a physical-device test.', 'One stress observation per browser project, without reader outcome or device performance claims.', 'Reading-page stability does not imply zero absolute viewport movement; browser scroll anchoring can move the page.'] }
await writeFile(path.join(root, reportFile), JSON.stringify(report, null, 2) + '\n')
console.log(JSON.stringify({ report: reportFile, tests: tests.length, stress: stress.map(({ project, result }) => ({ project, sourceToOpaqueMs: result.sourceToOpaqueMs, sourceToRestMs: result.sourceToRestMs })) }))
