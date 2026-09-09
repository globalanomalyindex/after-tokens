import { createHash } from 'node:crypto'
import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { gzipSync, gunzipSync } from 'node:zlib'

const implementationFiles = [
  'app/ambient-composition.css',
  'app/globals.css',
  'components/settle/settle-answer.tsx',
  'components/settle/ambient-composition.tsx',
  'components/settle/ambient-study.tsx',
  'lib/settle/experimental-recordings.ts',
  'lib/settle/reader.ts',
  'lib/settle/replay.ts',
  'components/settle/use-replay.ts',
]
const hash = (bytes) => createHash('sha256').update(bytes).digest('hex')
const writeJSON = (file, data) => writeFile(file, JSON.stringify(data, null, 2) + '\n')

/** Archive existing measurements without running a browser or changing their
 * measuredAt timestamp. Call only while the measured implementation is frozen.
 */
export async function archiveAmbientMotion(report, root, artifacts) {
  const archiveRelative = 'data/experiments/ambient-motion-2026-09-09'
  const archive = path.join(root, archiveRelative)
  await mkdir(archive, { recursive: true })
  const implementation = []
  for (const file of implementationFiles) implementation.push({ file, sha256: hash(await readFile(path.join(root, file))) })
  const sourceFixtures = []
  for (const id of new Set(report.results.map((result) => result.source))) {
    const directory = id.includes('__random-') ? 'parallel-qwen-random-2026-09-09' : 'parallel-qwen-2026-09-09'
    const file = `data/experiments/${directory}/compact/${id}.json`
    sourceFixtures.push({ id, file, sha256: hash(await readFile(path.join(root, file))), clock: 'step_wall_ms' })
  }
  const recordings = []
  for (const result of report.results) {
    const raw = await readFile(path.join(artifacts, `${result.name}-raw.json`))
    const parsed = JSON.parse(raw)
    if (parsed.samples.length !== result.frames) throw Error(`${result.name}: raw sample count differs from report`)
    if (parsed.finalText !== parsed.expectedText) throw Error(`${result.name}: raw final text is not exact`)
    const compressed = gzipSync(raw, { level: 9 })
    if (!gunzipSync(compressed).equals(raw)) throw Error(`${result.name}: compression round trip failed`)
    const file = `${result.name}-raw.json.gz`
    await writeFile(path.join(archive, file), compressed)
    recordings.push({ name: result.name, source: result.source, condition: result.condition, viewport: result.viewport, file, sha256: hash(compressed), bytes: compressed.length, uncompressedSha256: hash(raw), uncompressedBytes: raw.length, samples: parsed.samples.length })
  }
  const videos = []
  for (const [name, destination] of [['390-coherent', 'ambient-answer-mobile.webm'], ['390-coherent-sky', 'ambient-answer-long.webm']]) {
    if (!report.results.some((result) => result.name === name)) continue
    const sourceArtifact = path.join(artifacts, `${name}.webm`)
    const bytes = await readFile(sourceArtifact)
    if (!bytes.subarray(0, 4).equals(Buffer.from([0x1a, 0x45, 0xdf, 0xa3]))) throw Error(`${name}: expected a WebM/EBML header`)
    const file = `public/study/${destination}`
    await mkdir(path.join(root, 'public/study'), { recursive: true })
    await copyFile(sourceArtifact, path.join(root, file))
    const copied = await readFile(path.join(root, file))
    if (!copied.equals(bytes)) throw Error(`${name}: published video copy differs`)
    videos.push({ name, file, url: `study/${destination}`, sha256: hash(copied), bytes: copied.length, description: 'Actual browser viewport recording of this case; page initialization and scrolling are retained. No generated/interpolated frames or edited model text.' })
  }
  const archivedAt = new Date().toISOString()
  const manifest = {
    schemaVersion: 1, archivedAt, measuredAt: report.measuredAt,
    browser: report.browser, browserVersion: report.browserVersion,
    provenance: 'Hashes added after recording while the measured implementation and source fixtures were frozen. The archive timestamp is separate from the unchanged measurement timestamp.',
    implementation, sourceFixtures, recordings, videos,
  }
  const manifestFile = `${archiveRelative}/manifest.json`
  await writeJSON(path.join(root, manifestFile), manifest)
  return { ...report, archivedAt, implementation, sourceFixtures, artifactManifest: { file: manifestFile, sha256: hash(await readFile(path.join(root, manifestFile))) }, rawRecordings: recordings.map((recording) => ({ ...recording, file: `${archiveRelative}/${recording.file}` })), videos }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
  const reportFile = path.resolve(process.argv[2] ?? path.join(root, 'docs/ambient-motion-validation-2026-09-09.json'))
  const report = JSON.parse(await readFile(reportFile, 'utf8'))
  const archived = await archiveAmbientMotion(report, root, path.join(root, 'output/playwright/ambient-motion-2026-09-09'))
  await writeJSON(reportFile, archived)
  console.log(JSON.stringify({ measuredAt: archived.measuredAt, archivedAt: archived.archivedAt, recordings: archived.rawRecordings.length, videos: archived.videos, artifactManifest: archived.artifactManifest }, null, 2))
}
