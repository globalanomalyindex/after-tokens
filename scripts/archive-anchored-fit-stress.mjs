import { access, mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { SKELETON_REPORT, skeletonHash, skeletonImplementationSnapshot } from './archive-anchored-skeleton-motion.mjs'

const root = process.cwd()
const preflight = JSON.parse(await readFile(process.argv[2] ?? '/tmp/adaptive-fit-preflight.json'))
const rawBytes = await readFile(process.argv[3] ?? '/tmp/adaptive-fit-playwright-report.json'), raw = JSON.parse(rawBytes)
const measured = JSON.parse(await readFile(path.join(root, SKELETON_REPORT)))
const current = await skeletonImplementationSnapshot(root)
if (preflight.fingerprint !== measured.fingerprint || JSON.stringify(preflight.implementation) !== JSON.stringify(current)) throw Error('Forced-fit implementation differs from its preflight or measured implementation')
if (skeletonHash(await readFile(preflight.testFile)) !== preflight.testSha256) throw Error('Forced-fit test changed after its preflight')
if (raw.stats.expected !== 3 || raw.stats.unexpected || raw.stats.skipped || raw.stats.flaky) throw Error('Expected three clean forced-fit passes')
const tests = []
function collect(suites) {
  for (const suite of suites) {
    for (const spec of suite.specs ?? []) for (const test of spec.tests) tests.push(test)
    collect(suite.suites ?? [])
  }
}
collect(raw.suites)
const projects = new Set(), observations = []
const sourceFile = 'data/experiments/parallel-qwen-2026-09-09/compact/sky-blue__lowconf-b128-s32.json'
const sourceBytes = await readFile(sourceFile), source = JSON.parse(sourceBytes), sourceSha256 = skeletonHash(sourceBytes)
if (measured.sourceFixtures.find((fixture) => fixture.file === sourceFile)?.sha256 !== sourceSha256) throw Error('Stress source differs from the measured fixture')
for (const test of tests) {
  if (test.results.length !== 1 || test.results[0].status !== 'passed' || projects.has(test.projectName)) throw Error('Stress result is not one unique passed trial per project')
  projects.add(test.projectName)
  const attachment = test.results[0].attachments.find((item) => item.name === 'forced-fit-result')
  if (!attachment?.body || attachment.contentType !== 'application/json') throw Error('Missing exact forced-fit JSON attachment')
  const bytes = Buffer.from(attachment.body, 'base64'), observation = JSON.parse(bytes), result = observation.result
  if (observation.project !== test.projectName || result.material !== preflight.material || result.source !== source.id || result.selected !== source.answer || result.failures.length || result.fittingFrames <= 0 || result.visualDelayMs <= 100 || result.visualDelayMs >= 500 || result.observedInkDuration !== 180 || result.maxRestMovement >= .01 || result.maxShapeChange >= .05) throw Error('Stress attachment violates its tested contract')
  observations.push({ bytes, observation })
}
if (projects.size !== 3 || ['chromium', 'webkit', 'mobile-portrait'].some((project) => !projects.has(project))) throw Error('Missing a required browser project')
const archive = 'data/experiments/anchored-skeleton-fit-stress-2026-09-09', reportPath = 'docs/anchored-skeleton-fit-stress-2026-09-09.json'
for (const file of [reportPath, `${archive}/manifest.json`]) {
  try { await access(file) } catch (error) { if (error.code === 'ENOENT') continue; throw error }
  throw Error(`Refusing to overwrite stress evidence: ${file}`)
}
await mkdir(archive, { recursive: true })
await writeFile(`${archive}/playwright-report.json`, rawBytes)
const records = []
for (const { bytes, observation } of observations) {
  const file = `${archive}/${observation.project}.json`
  await writeFile(file, bytes)
  records.push({ file, sha256: skeletonHash(bytes), bytes: bytes.length, ...observation })
}
const report = {
  schemaVersion: 1, archivedAt: new Date().toISOString(), startedAt: preflight.startedAt,
  material: preflight.material, implementationFingerprint: preflight.fingerprint, implementation: current,
  test: { file: preflight.testFile, sha256: preflight.testSha256, command: "pnpm exec playwright test tests/e2e/ambient-answer.spec.ts --grep 'underestimated space fits' --workers=1 --reporter=json" },
  source: { file: sourceFile, sha256: sourceSha256, id: source.id },
  rawReport: { file: `${archive}/playwright-report.json`, sha256: skeletonHash(rawBytes), bytes: rawBytes.length },
  stats: raw.stats, records,
  method: 'Three authored underallocation stress trials, one per browser project. The real sky fixture is restarted to a verified active five-line frame, then its final event is forced immediately. The browser fits the frame while keeping the entire answer hidden and the same ornament mounted, then exposes one opaque answer and settles it once. This tests a rendering branch the eight ordinary replay observations did not need.',
  clocks: 'Reported delay is first sampled source-complete to first sampled fully-visible frame. The source-complete event was forced; original model/capture timing is not replayed. The authored fit duration is 180ms and observed scheduling delays are reported as measured, without subtracting them.',
  caveats: ['One trial per project; not a latency distribution or performance benchmark.', 'Mobile is iPhone 14 browser emulation, not a physical-device measurement.', 'Internal text geometry permits a 0.05px DOM Range bound during the shared transform; stationary rest is checked separately at 0.01px.', 'No reader-benefit or preference claim.'],
}
await writeFile(`${archive}/manifest.json`, JSON.stringify(report, null, 2) + '\n')
await writeFile(reportPath, JSON.stringify(report, null, 2) + '\n')
console.log(JSON.stringify({ report: reportPath, records: records.map(({ project, result }) => ({ project, visualDelayMs: result.visualDelayMs, maxRestMovement: result.maxRestMovement })) }))
