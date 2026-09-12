import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { gzipSync, gunzipSync } from 'node:zlib'

export const MATERIAL = 'ambient-cell-skeleton-v7'
export const REPORT = 'docs/ambient-skeleton-v7-motion-validation-2026-09-12.json'
export const ARCHIVE = 'data/experiments/ambient-skeleton-v7-motion-2026-09-12'
export const ARTIFACTS = 'output/playwright/ambient-skeleton-v7-motion-2026-09-12'
export const hash = (bytes) => createHash('sha256').update(bytes).digest('hex')
export const fingerprint = (files) => hash(JSON.stringify(files))
const FILES = [
  'app/ambient-composition.css', 'app/skeleton-division.css', 'app/globals.css',
  'components/settle/settle-answer.tsx', 'components/settle/use-reading-surface.ts', 'components/settle/bubble-transfer.tsx',
  'components/settle/ambient-composition.tsx', 'components/settle/skeleton-division.tsx', 'components/settle/ambient-study.tsx',
  'components/settle/use-replay.ts', 'components/settle/settle-stage.tsx', 'lib/settle/ambient-score.ts', 'lib/settle/answer-envelope.ts',
  'lib/settle/reader.ts', 'lib/settle/types.ts', 'lib/settle/replay.ts', 'lib/settle/experimental-recordings.ts',
  'lib/settle/snapshot-study.ts', 'components/settle/snapshot-study.tsx', 'lib/brand/brands.ts', 'lib/brand/provider.tsx', 'lib/settle/voice.ts',
  'scripts/measure-ambient-skeleton-v7-motion.mjs', 'scripts/archive-ambient-skeleton-v7-motion.mjs', 'scripts/measure-anchored-skeleton-motion.mjs',
]
export const implementationSnapshot = (root) => Promise.all(FILES.map(async (file) => ({ file, sha256: hash(await readFile(path.join(root, file))) })))

export async function archiveAmbientV7(report, root) {
  if (report.material !== MATERIAL || report.schemaVersion !== 1 || report.results.length !== 8) throw Error('Expected eight v7 observations')
  const implementation = await implementationSnapshot(root)
  if (fingerprint(implementation) !== report.fingerprint || JSON.stringify(implementation) !== JSON.stringify(report.implementation)) throw Error('Implementation changed after observation started')
  for (const fixture of report.sourceFixtures) if (hash(await readFile(path.join(root, fixture.file))) !== fixture.sha256) throw Error('Source fixture changed')
  const records = [], pending = [], names = new Set()
  for (const result of report.results) {
    if (!result.guards.passed || names.has(result.name) || !/^(390|1380)-(static|breathe|reshape)(-(sky|random))?$/.test(result.name)) throw Error('Invalid observed case')
    names.add(result.name)
    const bytes = await readFile(path.join(root, ARTIFACTS, `${result.name}-raw.json`)), raw = JSON.parse(bytes)
    if (raw.fingerprint !== report.fingerprint || raw.material !== MATERIAL || raw.samples.length !== result.frames || raw.finalText !== raw.expectedText || raw.nonemptyTextUpdates !== 1) throw Error('Raw observation differs from report')
    const compressed = gzipSync(bytes, { level: 9 }), file = `${result.name}-raw.json.gz`
    if (!gunzipSync(compressed).equals(bytes)) throw Error('Compression roundtrip failed')
    pending.push({ file, bytes: compressed })
    records.push({ name: result.name, source: result.source, condition: result.condition, viewport: result.viewport, file, bytes: compressed.length, sha256: hash(compressed), uncompressedBytes: bytes.length, uncompressedSha256: hash(bytes), frames: raw.samples.length })
  }
  await mkdir(path.join(root, ARCHIVE), { recursive: true })
  for (const record of pending) await writeFile(path.join(root, ARCHIVE, record.file), record.bytes)
  const manifest = { schemaVersion: 1, material: MATERIAL, fingerprint: report.fingerprint, implementation, sourceFixtures: report.sourceFixtures, measurementStartedAt: report.measurementStartedAt, measuredAt: report.measuredAt, browser: report.browser, browserVersion: report.browserVersion, playbackScale: report.playbackScale, records }
  const file = `${ARCHIVE}/manifest.json`, bytes = Buffer.from(JSON.stringify(manifest, null, 2) + '\n')
  await writeFile(path.join(root, file), bytes)
  return { ...report, archive: { file, sha256: hash(bytes), records: records.length } }
}
