import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { gzipSync, gunzipSync } from 'node:zlib'

export const SKELETON_MATERIAL = 'adaptive-cell-skeleton-v5'
export const SKELETON_ARCHIVE = 'data/experiments/anchored-skeleton-motion-2026-09-09'
export const SKELETON_ARTIFACTS = 'output/playwright/anchored-skeleton-motion-2026-09-09'
export const SKELETON_REPORT = 'docs/anchored-skeleton-motion-validation-2026-09-09.json'
export const skeletonHash = (bytes) => createHash('sha256').update(bytes).digest('hex')
const implementationFiles = [
  'app/ambient-composition.css', 'app/skeleton-division.css', 'app/globals.css',
  'components/settle/settle-answer.tsx', 'components/settle/ambient-composition.tsx',
  'components/settle/ambient-study.tsx', 'components/settle/use-answer-envelope.ts', 'lib/settle/answer-envelope.ts', 'components/settle/skeleton-division.tsx', 'components/settle/use-replay.ts',
  'lib/brand/brands.ts', 'lib/brand/provider.tsx', 'lib/settle/voice.ts',
  'lib/settle/experimental-recordings.ts', 'lib/settle/reader.ts', 'lib/settle/replay.ts', 'lib/settle/types.ts',
  'lib/settle/snapshot-study.ts', 'components/settle/snapshot-study.tsx',
  'scripts/measure-anchored-skeleton-motion.mjs', 'scripts/archive-anchored-skeleton-motion.mjs',
]
const writeJSON = (file, data) => writeFile(file, JSON.stringify(data, null, 2) + '\n')

export async function skeletonImplementationSnapshot(root) {
  return Promise.all(implementationFiles.map(async (file) => ({ file, sha256: skeletonHash(await readFile(path.join(root, file))) })))
}

export function assertSkeletonCompatibility(previous, current) {
  for (const key of ['material', 'fingerprint', 'playbackScale', 'cyclePeriodMs', 'introDurationMs', 'glimmerPeriodMs', 'schemaVersion']) {
    if (previous?.[key] !== current?.[key] || previous?.[key] === undefined) throw Error(`Incompatible skeleton archive/append: ${key} differs or is missing`)
  }
  if (current.material !== SKELETON_MATERIAL) throw Error('Incompatible skeleton material')
}

export async function readOptionalJSON(file) {
  try { return JSON.parse(await readFile(file, 'utf8')) }
  catch (error) { if (error.code === 'ENOENT') return null; throw error }
}

/** The report must already contain fingerprints captured before measurement.
 * Rehashing here verifies the freeze; it never relabels older raw observations
 * with current implementation hashes. Historical ambient paths are untouched. */
export async function archiveSkeletonMotion(report, root, artifacts = path.join(root, SKELETON_ARTIFACTS)) {
  assertSkeletonCompatibility(report, report)
  const current = await skeletonImplementationSnapshot(root)
  if (JSON.stringify(current) !== JSON.stringify(report.implementation)) throw Error('Skeleton implementation changed after measurement began; refusing archive')
  if (!report.sourceFixtures?.length) throw Error('Skeleton source fixture fingerprints are missing')
  for (const fixture of report.sourceFixtures) {
    if (skeletonHash(await readFile(path.join(root, fixture.file))) !== fixture.sha256) throw Error(`Source fixture changed: ${fixture.file}`)
  }
  const archive = path.join(root, SKELETON_ARCHIVE)
  const existing = await readOptionalJSON(path.join(archive, 'manifest.json'))
  if (existing) assertSkeletonCompatibility(existing, report)
  if (!report.results?.length) throw Error('Cannot archive an empty skeleton report')
  const names = new Set()
  const pending = []
  for (const result of report.results) {
    if (!/^(390|1380)-(static|breathe|reshape)(-(sky|random))?$/.test(result.name) || names.has(result.name)) throw Error(`Invalid or duplicate skeleton case: ${result.name}`)
    names.add(result.name)
    const raw = await readFile(path.join(artifacts, `${result.name}-raw.json`))
    const parsed = JSON.parse(raw)
    assertSkeletonCompatibility(parsed, report)
    if (parsed.sourceId !== result.source || parsed.samples.length !== result.frames) throw Error(`${result.name}: raw identity/sample count differs from report`)
    if (parsed.finalText !== parsed.expectedText || !parsed.finalText || parsed.nonemptyTextUpdates !== 1) throw Error(`${result.name}: raw answer is not one exact nonempty arrival`)
    const compressed = gzipSync(raw, { level: 9 })
    if (!gunzipSync(compressed).equals(raw)) throw Error(`${result.name}: compression round trip failed`)
    pending.push({ file: `${result.name}-raw.json.gz`, bytes: compressed, record: {
      name: result.name, source: result.source, condition: result.condition, viewport: result.viewport,
      measuredAt: result.measuredAt, file: `${result.name}-raw.json.gz`, sha256: skeletonHash(compressed), bytes: compressed.length,
      uncompressedSha256: skeletonHash(raw), uncompressedBytes: raw.length, samples: parsed.samples.length,
    } })
  }
  const pendingVideos = []
  for (const [name, destination] of [['390-reshape', 'anchored-skeleton-mobile.webm'], ['390-reshape-sky', 'anchored-skeleton-long.webm']]) {
    if (!names.has(name)) continue
    const bytes = await readFile(path.join(artifacts, `${name}.webm`))
    if (!bytes.subarray(0, 4).equals(Buffer.from([0x1a, 0x45, 0xdf, 0xa3]))) throw Error(`${name}: expected a WebM/EBML header`)
    pendingVideos.push({ bytes, record: {
      name, file: `public/study/${destination}`, url: `study/${destination}`, sha256: skeletonHash(bytes), bytes: bytes.length,
      description: 'Actual browser viewport recording at explicitly selected 0.5× source inspection speed. Loading, scrolling and source output are retained; no generated/interpolated frames or edited text.',
    } })
  }
  // Validate every raw file and source before writing any archive destination.
  await mkdir(archive, { recursive: true })
  for (const item of pending) await writeFile(path.join(archive, item.file), item.bytes)
  for (const item of pendingVideos) {
    await mkdir(path.dirname(path.join(root, item.record.file)), { recursive: true })
    await writeFile(path.join(root, item.record.file), item.bytes)
    if (skeletonHash(await readFile(path.join(root, item.record.file))) !== item.record.sha256) throw Error(`${item.record.name}: published video copy differs`)
  }
  const archivedAt = new Date().toISOString()
  const manifest = {
    schemaVersion: report.schemaVersion, material: report.material, fingerprint: report.fingerprint,
    playbackScale: report.playbackScale, cyclePeriodMs: report.cyclePeriodMs, introDurationMs: report.introDurationMs, glimmerPeriodMs: report.glimmerPeriodMs,
    archivedAt, measurementStartedAt: report.measurementStartedAt, measuredAt: report.measuredAt,
    browser: report.browser, browserVersion: report.browserVersion,
    provenance: 'Implementation/source fingerprints captured before measurement and verified unchanged before archive. Per-case measurement dates are retained. This is a separate anchored-bar archive; the earlier feathered and solid-v1 treatments is not overwritten.',
    implementation: report.implementation, sourceFixtures: report.sourceFixtures,
    recordings: pending.map((item) => item.record), videos: pendingVideos.map((item) => item.record),
  }
  const manifestFile = `${SKELETON_ARCHIVE}/manifest.json`
  await writeJSON(path.join(root, manifestFile), manifest)
  return { ...report, archivedAt,
    artifactManifest: { file: manifestFile, sha256: skeletonHash(await readFile(path.join(root, manifestFile))) },
    rawRecordings: manifest.recordings.map((recording) => ({ ...recording, file: `${SKELETON_ARCHIVE}/${recording.file}` })), videos: manifest.videos,
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
  const reportFile = path.resolve(process.argv[2] ?? path.join(root, SKELETON_REPORT))
  if (!path.basename(reportFile).startsWith('anchored-skeleton-')) throw Error('Refusing to overwrite a report outside the anchored-skeleton namespace')
  const report = JSON.parse(await readFile(reportFile, 'utf8'))
  const archived = await archiveSkeletonMotion(report, root)
  await writeJSON(reportFile, archived)
  console.log(JSON.stringify({ material: archived.material, fingerprint: archived.fingerprint, recordings: archived.rawRecordings.length, artifactManifest: archived.artifactManifest }, null, 2))
}
