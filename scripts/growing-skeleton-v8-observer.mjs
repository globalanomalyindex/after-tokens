/** Independent commitment oracle. It reads source positions and recorded step
 * durations, never the renderer's sizing or release helper. Exact policy
 * segmentation is additionally covered by the corpus reducer tests. */
export function commitmentOracle(trace) {
  const commits = new Map(), checkpoints = []
  let elapsed = 0, terminal = false, prefix = ''
  for (const [step, duration] of trace.step_ms.entries()) {
    if (!Number.isFinite(duration) || duration < 0) throw Error('Invalid source duration')
    elapsed += duration
    for (const token of trace.tokens.filter((token) => token.step === step)) commits.set(token.pos, token.text)
    if (!terminal) {
      prefix = ''
      for (let position = 0; commits.has(position); position++) {
        const text = commits.get(position)
        if (['<|im_end|>', '<|endoftext|>'].includes(text)) { terminal = true; break }
        prefix += text
      }
    }
    checkpoints.push({ atMs: elapsed, prefix, terminal })
  }
  if (!terminal && commits.size === trace.sampler.max_new_tokens) checkpoints.at(-1).terminal = true
  if (checkpoints.at(-1)?.prefix !== trace.answer || !checkpoints.at(-1)?.terminal) throw Error('Fixture final answer or finality disagrees with commitments')
  return { durationMs: elapsed, finalityMs: checkpoints.find((point) => point.terminal).atMs, checkpoints }
}

/** Browser instrumentation. The expected source is available only to the
 * verifier; it is never supplied to a presentation component. */
export async function observeGrowingV8(root, input) {
  const samples = [], changes = [], startedAt = performance.now()
  const nodeIds = new WeakMap(); let nextId = 0
  const identity = (node) => { if (!nodeIds.has(node)) nodeIds.set(node, ++nextId); return nodeIds.get(node) }
  let previousText = '', readyAt = null
  const observer = new MutationObserver(() => {
    const text = root.querySelector('.settle-page').textContent ?? ''
    if (text !== previousText) {
      changes.push({ atMs: performance.now() - startedAt, text, sourceAtMs: Number(root.dataset.sourceAtMs), status: root.dataset.status })
      previousText = text
    }
  })
  observer.observe(root, { childList: true, characterData: true, subtree: true })
  const replay = root.closest('#playground').querySelector('[aria-label="replay the recording"]')
  replay.click()
  const box = (r, origin) => ({ x: r.left - origin.left, y: r.top - origin.top, width: r.width, height: r.height })
  try {
    await new Promise((resolve, reject) => {
      const tick = (now) => {
        try {
          const frame = root.querySelector('.settle-answer-frame'), frameBox = frame.getBoundingClientRect()
          const page = root.querySelector('.settle-page'), pageBox = page.getBoundingClientRect(), scrollBefore = scrollY
          const waiting = root.querySelector('.settle-waiting-field'), transfer = root.querySelector('[data-bubble-transfer]')
          const passages = [...root.querySelectorAll('[data-passage]')].map((node) => {
            const css = getComputedStyle(node), points = [], bounds = []
            const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT); let text
            while ((text = walker.nextNode())) for (const match of text.textContent.matchAll(/\S+/g)) {
              const range = document.createRange(); range.setStart(text, match.index); range.setEnd(text, match.index + 1)
              const rect = range.getBoundingClientRect(); points.push([rect.left - pageBox.left, rect.top - pageBox.top]); range.setEnd(text, match.index + match[0].length)
              for (const rect of range.getClientRects()) bounds.push(box(rect, frameBox))
            }
            return { id: identity(node), passageId: node.dataset.passage, text: node.textContent, pending: node.dataset.pending === 'true', arriving: node.dataset.arriving === 'true',
              opacity: Number(css.opacity), top: parseFloat(css.top), visibility: css.visibility, filter: css.filter, transform: css.transform,
              animation: css.animationName, duration: css.animationDuration, points, bounds }
          })
          const afterPage = page.getBoundingClientRect()
          const rows = [...root.querySelectorAll('.ambient-composition__bar')].map((row) => ({ id: identity(row), shown: row.dataset.shown === 'true', ...box(row.getBoundingClientRect(), frameBox),
            cells: [...row.querySelectorAll('.ambient-composition__presence')].map((cell) => {
              const ink = cell.querySelector('.ambient-composition__ink'), css = getComputedStyle(ink), rect = ink.getBoundingClientRect()
              let alpha = 1, visible = true
              for (let ancestor = ink; ancestor && ancestor !== frame; ancestor = ancestor.parentElement) {
                const style = getComputedStyle(ancestor); alpha *= Number(style.opacity)
                visible &&= style.visibility !== 'hidden' && style.display !== 'none'
              }
              return { id: identity(cell), borrowed: cell.dataset.borrowed ?? null, ...box(rect, frameBox), alpha, visible: visible && alpha > .006 && rect.width >= 1 && rect.height >= 1 && rect.bottom > frameBox.top && rect.top < frameBox.bottom,
                filter: css.filter, backgroundImage: css.backgroundImage, radius: css.borderTopLeftRadius }
            }) }))
          const cloned = [...root.querySelectorAll('.bubble-transfer__cell')].map((cell) => ({ ...box(cell.getBoundingClientRect(), frameBox),
            origin: { x: parseFloat(cell.style.left), y: parseFloat(cell.style.top), width: parseFloat(cell.style.width), height: parseFloat(cell.style.height) },
            alpha: Number(cell.style.getPropertyValue('--transfer-alpha')), opacity: Number(getComputedStyle(cell).opacity), duration: getComputedStyle(cell).animationDuration }))
          const atMs = now - startedAt
          if (root.dataset.visualReady === 'true' && readyAt === null) readyAt = atMs
          samples.push({ atMs, sourceAtMs: Number(root.dataset.sourceAtMs), status: root.dataset.status, policy: root.dataset.policy, material: root.dataset.material,
            phase: root.dataset.answerPhase, ready: root.dataset.visualReady === 'true', releasedLength: Number(root.dataset.releasedLength), text: page.textContent, passages,
            frame: { ...box(frameBox, frameBox), overflow: getComputedStyle(frame).overflow }, page: box(pageBox, frameBox), lineHeight: parseFloat(getComputedStyle(page).lineHeight),
            coherent: Math.abs(afterPage.x - pageBox.x) < .001 && Math.abs(afterPage.y - pageBox.y) < .001, scrollChange: scrollY - scrollBefore,
            tail: waiting ? { ...box(waiting.getBoundingClientRect(), frameBox), opacity: Number(getComputedStyle(waiting).opacity) } : null,
            rows, transferId: transfer ? identity(transfer) : null, transferDuration: transfer ? getComputedStyle(transfer).animationDuration : null, cloned,
            legacyCount: root.querySelectorAll('.settle-unit,.settle-candidate,.settle-draft,.settle-field,.settle-mark').length,
            runningAnimations: root.getAnimations({ subtree: true }).filter((animation) => animation.playState === 'running').length })
          if (readyAt !== null && atMs - readyAt > 1000) { resolve(); return }
          if (atMs > input.oracle.durationMs + 4000) { reject(Error('Growing surface did not reach rest')); return }
          requestAnimationFrame(tick)
        } catch (error) { reject(error) }
      }
      requestAnimationFrame(tick)
    })
  } finally { observer.disconnect() }
  return { ...input, observedAt: new Date().toISOString(), samples, changes, finalText: root.querySelector('.settle-page').textContent }
}

const max = (values) => values.length ? Math.max(...values) : 0
const spread = (values) => values.length ? Math.max(...values) - Math.min(...values) : 0
export function summarizeGrowingV8(raw) {
  const failures = [], check = (value, message) => { if (!value) failures.push(message) }
  const knownAt = (time) => raw.oracle.checkpoints.findLast((point) => point.atMs <= time + .01) ?? { prefix: '', terminal: false }
  const loading = raw.samples.filter((sample) => sample.status !== 'complete'), resting = raw.samples.filter((sample) => sample.ready)
  const containerRest = resting.filter((sample) => sample.runningAnimations === 0 && Math.abs(sample.frame.height - sample.page.height) < .1)
  check(raw.samples.length > 100 && loading.length > 30 && resting.length > 10, 'insufficient loading or rest coverage')
  check(raw.finalText === raw.expectedText && !!raw.finalText, 'final text differs')
  check(raw.samples.every((sample) => sample.material === 'growing-cell-skeleton-v8' && sample.policy === raw.policy && sample.legacyCount === 0), 'wrong renderer or policy')
  check(raw.samples.every((sample) => sample.text.length === sample.releasedLength && knownAt(sample.sourceAtMs).prefix.startsWith(sample.text)), 'text exceeds actually committed source prefix')
  check(raw.changes.every((event) => knownAt(event.sourceAtMs).prefix.startsWith(event.text)), 'DOM mutation exceeds committed source')
  if (raw.policy === 'answer') check(loading.every((sample) => !sample.text) && raw.changes.filter((change) => change.text).length === 1, 'whole answer appeared early or more than once')
  const pageIds = new Map(), restBaseline = new Map(), batches = new Map()
  let maximumOriginMismatchPx = 0, verifiedCaptureBatches = 0, skippedOriginComparisons = 0
  let localGlyphDrift = 0, coherentRestSamples = 0, incoherentRestSamples = 0, reanimatedOldPassages = 0
  for (const [sampleIndex, sample] of raw.samples.entries()) {
    for (const passage of sample.passages) {
      check(!pageIds.has(passage.passageId) || pageIds.get(passage.passageId) === passage.id, 'readable passage identity changed')
      pageIds.set(passage.passageId, passage.id)
      const isRest = !passage.arriving && !passage.pending
      if (restBaseline.has(passage.id) && !isRest) reanimatedOldPassages++
      check(passage.filter === 'none' && passage.transform === 'none' && passage.opacity >= 0 && passage.opacity <= 1 && passage.top >= -.201 && passage.top <= 1.501, 'ink exceeded bounded handover')
      if (passage.arriving) check(passage.animation === 'reading-ink-arrive' && Math.abs(parseFloat(passage.duration) - .28) < 1e-6, 'ink handover timing changed')
      if (isRest) {
        check(passage.opacity === 1 && passage.visibility === 'visible' && passage.top === 0, 'resting ink is not fully readable')
        if (!sample.coherent) { incoherentRestSamples++; continue }
        coherentRestSamples++
        if (!restBaseline.has(passage.id)) restBaseline.set(passage.id, passage.points)
        const before = restBaseline.get(passage.id)
        check(before.length === passage.points.length, 'rested word geometry count changed')
        passage.points.forEach((point, index) => { if (before[index]) localGlyphDrift = Math.max(localGlyphDrift, Math.hypot(point[0] - before[index][0], point[1] - before[index][1])) })
      }
    }
    if (sample.transferId && !batches.has(sample.transferId)) {
      const previous = raw.samples[sampleIndex - 1]
      if (sample.cloned.length && previous && sample.atMs - previous.atMs <= 34) {
        const origins = previous.rows.flatMap((row) => row.cells.filter((cell) => cell.visible))
        check(origins.length > 0, 'captured bubbles had no visible pre-handover origins')
        for (const cell of sample.cloned) {
          const mismatch = Math.min(...origins.map((origin) => Math.max(Math.abs(cell.origin.x - origin.x), Math.abs(cell.origin.y - origin.y), Math.abs(cell.origin.width - origin.width))))
          maximumOriginMismatchPx = Math.max(maximumOriginMismatchPx, mismatch)
        }
        verifiedCaptureBatches++
      } else if (sample.cloned.length) skippedOriginComparisons++
      batches.set(sample.transferId, { id: sample.transferId, firstAtMs: sample.atMs, sourceAtMs: sample.sourceAtMs, releasedLength: sample.releasedLength, newText: sample.passages.some((passage) => passage.arriving), newPassageIds: sample.passages.filter((passage) => passage.arriving).map((passage) => passage.id), cloned: sample.cloned, duration: sample.transferDuration })
    }
    if (sample.cloned.length) {
      const borrowed = sample.rows.flatMap((row) => row.cells.filter((cell) => cell.borrowed))
      check(borrowed.length === sample.cloned.length && borrowed.every((cell) => !cell.visible), 'borrowed originals duplicated their captured clones')
      if (sample.passages.some((passage) => !passage.arriving && !passage.pending)) check(sample.cloned.length <= 6, 'new batch borrowed the whole field despite previously readable text')
    }
  }
  check(reanimatedOldPassages === 0 && localGlyphDrift < .05, 'settled reading ink moved or reanimated')
  check(coherentRestSamples > 50 && incoherentRestSamples / Math.max(1, coherentRestSamples + incoherentRestSamples) < .25, 'insufficient coherent reading-rest coverage')
  check(maximumOriginMismatchPx < 6 && verifiedCaptureBatches > 0, 'captured origins do not match the immediately preceding visible field')
  const transfers = [...batches.values()].map((batch) => {
    const eligible = batch.newText ? raw.samples.find((sample) => sample.releasedLength >= batch.releasedLength) : raw.samples.find((sample) => sample.status === 'complete')
    const hasBatch = (sample) => sample.atMs >= batch.firstAtMs && batch.newPassageIds.every((id) => sample.passages.some((passage) => passage.id === id))
    const ink = batch.newText ? raw.samples.find((sample) => hasBatch(sample) && sample.passages.filter((passage) => batch.newPassageIds.includes(passage.id)).some((passage) => passage.visibility === 'visible' && passage.opacity > .001)) : eligible
    const opaque = batch.newText ? raw.samples.find((sample) => hasBatch(sample) && sample.passages.filter((passage) => batch.newPassageIds.includes(passage.id)).every((passage) => passage.visibility === 'visible' && passage.opacity >= .999 && !passage.pending)) : eligible
    const rest = raw.samples.find((sample) => hasBatch(sample) && (batch.newText ? sample.passages.filter((passage) => batch.newPassageIds.includes(passage.id)).every((passage) => !passage.arriving && !passage.pending && passage.top === 0) : sample.ready))
    const times = [eligible?.atMs, ink?.atMs, opaque?.atMs, rest?.atMs]
    check(times.every((time, index) => Number.isFinite(time) && (!index || time >= times[index - 1])), 'missing ordered per-batch eligibility/ink/opacity/rest milestones')
    return { ...batch, firstSampledEligibilityMs: eligible?.atMs, firstSampledInkMs: ink?.atMs, firstSampledNearFullOpacityMs: opaque?.atMs, firstSampledRestMs: rest?.atMs,
      eligibilityToInkMs: ink?.atMs - eligible?.atMs, eligibilityToNearFullOpacityMs: opaque?.atMs - eligible?.atMs, eligibilityToRestMs: rest?.atMs - eligible?.atMs }
  })
  check(transfers.length >= (raw.policy === 'sentence' ? 2 : 1) && transfers.every((batch) => Math.abs(parseFloat(batch.duration) - .28) < 1e-6), 'missing bounded material handovers')
  check(raw.samples.some((sample) => sample.passages.some((passage) => passage.opacity > .01 && passage.opacity < .99)) && raw.samples.some((sample) => sample.cloned.length), 'missing actual bubble and ink blend')
  check(resting.every((sample) => !sample.tail && !sample.transferId && sample.text === raw.expectedText && sample.frame.overflow === 'visible'), 'final residual material or clipped settled ink')
  check(containerRest.length > 10, 'final container never finished its separate contraction')
  check(containerRest.every((sample) => sample.passages.every((passage) => passage.bounds.length && passage.bounds.every((rect) => rect.x >= -.1 && rect.y >= -.1 && rect.x + rect.width <= sample.frame.width + .1 && rect.y + rect.height <= sample.frame.height + .1))), 'final words exceed readable frame')
  const rows = loading.flatMap((sample) => sample.rows.filter((row) => row.shown))
  check(loading.every((sample) => sample.rows.length === 14) && rows.every((row) => row.cells.length >= 1 && row.cells.length <= 3), 'long-bar row material changed')
  check(rows.every((row) => row.cells.every((cell) => cell.filter === 'none' && cell.backgroundImage === 'none' && parseFloat(cell.radius) > 0)), 'bars lost solid rounded material')
  let minimumGap = Infinity
  for (const row of rows) { const cells = row.cells.filter((cell) => cell.visible); for (let i = 1; i < cells.length; i++) minimumGap = Math.min(minimumGap, cells[i].x - cells[i - 1].x - cells[i - 1].width) }
  check(minimumGap >= -.05, 'visible long bars overlap')
  const finality = raw.samples.find((sample) => sample.status === 'complete'), opaque = raw.samples.find((sample) => sample.status === 'complete' && sample.passages.length && sample.passages.every((passage) => passage.opacity >= .999 && !passage.pending)), ready = resting[0]
  check(finality && opaque && ready && finality.atMs <= opaque.atMs && opaque.atMs <= ready.atMs, 'missing ordered final source/opacity/rest milestones')
  const summary = { name: raw.name, policy: raw.policy, viewport: raw.viewport, source: raw.source, observedAt: raw.observedAt, frames: raw.samples.length, exactFinalText: raw.finalText === raw.expectedText,
    changes: raw.changes.length, batches: transfers.length, transfers, maximumOriginMismatchPx, verifiedCaptureBatches, skippedOriginComparisons, coherentRestSamples, incoherentRestSamples, localGlyphDriftPx: localGlyphDrift, reanimatedOldPassages,
    maximumRows: max(loading.map((sample) => sample.rows.filter((row) => row.shown).length)), waitingFrameVariationPx: spread(loading.map((sample) => sample.frame.height)),
    maximumClonedCells: max(raw.samples.map((sample) => sample.cloned.length)), minimumVisibleGapPx: Number.isFinite(minimumGap) ? minimumGap : null,
    sourceToFinalOpacityMs: opaque?.atMs - finality?.atMs, sourceToFinalRestMs: ready?.atMs - finality?.atMs, fittingFrames: raw.samples.filter((sample) => sample.phase === 'fitting').length,
    sourceToContainerRestMs: containerRest[0]?.atMs - finality?.atMs, inkRestToContainerRestMs: containerRest[0]?.atMs - ready?.atMs, containerRestSamples: containerRest.length, finalFrameHeightPx: containerRest.at(-1)?.frame.height, finalPageHeightPx: containerRest.at(-1)?.page.height, guards: { passed: failures.length === 0, failures: [...new Set(failures)] } }
  if (failures.length) throw Object.assign(Error(`${raw.name}: ${summary.guards.failures.join('; ')}`), { summary })
  return summary
}
