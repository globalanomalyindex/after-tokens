import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { gzipSync } from 'node:zlib'
export const MATERIAL = 'growing-cell-skeleton-v8'
export const REPORT = 'docs/growing-skeleton-v8-validation-2026-09-12.json'
export const RAW = 'output/playwright/growing-skeleton-v8-2026-09-12'
export const ARCHIVE = 'data/experiments/growing-skeleton-v8-2026-09-12'
export const hash = (bytes) => createHash('sha256').update(bytes).digest('hex')
export const fingerprint = (files) => hash(JSON.stringify(files))
const files = ['app/globals.css', 'app/ambient-composition.css', 'app/skeleton-division.css',
  'components/settle/settle-answer.tsx', 'components/settle/use-reading-surface.ts', 'components/settle/bubble-transfer.tsx', 'components/settle/ambient-composition.tsx', 'components/settle/skeleton-division.tsx',
  'components/settle/hero-intro.tsx', 'components/settle/hero-intro.module.css', 'components/sections/section-hook.tsx', 'components/settle/settle-stage.tsx', 'components/settle/ambient-study.tsx', 'components/settle/snapshot-study.tsx', 'components/settle/use-replay.ts', 'lib/settle/reader.ts', 'lib/settle/boundary.ts', 'lib/settle/types.ts', 'lib/settle/replay.ts',
  'lib/settle/growing-geometry.ts', 'lib/settle/ambient-geometry.ts', 'lib/settle/answer-envelope.ts', 'lib/settle/voice.ts', 'lib/brand/brands.ts',
  'scripts/growing-skeleton-v8-observer.mjs', 'scripts/measure-growing-skeleton-v8.mjs', 'scripts/archive-growing-skeleton-v8.mjs']
export const implementationSnapshot = () => Promise.all(files.map(async (file) => ({ file, sha256: hash(await readFile(file)) })))
export async function archiveGrowingV8(report) {
  if (report.material !== MATERIAL || report.results.length !== 4 || report.results.some((result) => !result.guards.passed || result.guards.failures.length)) throw Error('Expected four passing v8 observations')
  if (fingerprint(await implementationSnapshot()) !== report.fingerprint) throw Error('Implementation changed during observation')
  if (hash(await readFile(report.fixture.file)) !== report.fixture.sha256) throw Error('Source fixture changed')
  await mkdir(ARCHIVE, { recursive: true })
  const records = []
  for (const result of report.results) {
    const source = `${RAW}/${result.name}.json`, bytes = await readFile(source), raw = JSON.parse(bytes)
    if (raw.fingerprint !== report.fingerprint || raw.samples.length !== result.frames || raw.finalText !== raw.expectedText) throw Error('Raw evidence mismatches summary')
    const zipped = gzipSync(bytes), file = `${ARCHIVE}/${result.name}.json.gz`
    await writeFile(file, zipped)
    records.push({ name: result.name, file, bytes: zipped.length, sha256: hash(zipped), rawBytes: bytes.length, rawSha256: hash(bytes) })
  }
  const manifest = { material: MATERIAL, fingerprint: report.fingerprint, implementation: report.implementation, fixture: report.fixture, records }
  const manifestFile = `${ARCHIVE}/manifest.json`, bytes = Buffer.from(JSON.stringify(manifest, null, 2) + '\n')
  await writeFile(manifestFile, bytes)
  await writeFile(REPORT, JSON.stringify({ ...report, archive: { file: manifestFile, sha256: hash(bytes), records: records.length } }, null, 2) + '\n')
}
