import { expect, test, type Locator, type Page } from '@playwright/test'
import sleep from '../../data/experiments/parallel-qwen-2026-09-09/compact/sleep-tips__lowconf-b128-s32.json'
import sky from '../../data/experiments/parallel-qwen-2026-09-09/compact/sky-blue__lowconf-b128-s32.json'

async function startStudy(page: Page): Promise<Locator> {
  await page.goto('/')
  const study = page.locator('.ambient-study')
  await study.scrollIntoViewIfNeeded()
  await page.evaluate(() => document.fonts.ready)
  await expect(study).toHaveAttribute('data-source-id', sleep.id)
  await study.getByRole('button', { name: 'replay all', exact: true }).click()
  await expect(study.locator('.settle[data-policy="answer"]')).toHaveCount(3)
  await expect(study.locator('[role="status"][aria-live="polite"]')).toHaveCount(1)
  return study
}

test('three appearances preserve one source result and reveal the whole answer after their fit', async ({ page }) => {
  const study = await startStudy(page)
  const observations = await study.evaluate(async (root) => {
    const surfaces = [...root.querySelectorAll<HTMLElement>('.settle[data-policy="answer"]')]
    const textUpdates = surfaces.map(() => 0)
    const previous = surfaces.map((surface) => surface.querySelector('.settle-page')?.textContent ?? '')
    const failures: string[] = []
    const observer = new MutationObserver(() => {
      surfaces.forEach((surface, index) => {
        const text = surface.querySelector('.settle-page')?.textContent ?? ''
        if (text !== previous[index]) {
          if (text) textUpdates[index] += 1
          previous[index] = text
        }
      })
    })
    observer.observe(root, { subtree: true, childList: true, characterData: true })
    let waitingSamples = 0
    let finalSamples = 0
    let sawArrival = false
    const firstAppearance = new Map<string, string>()
    const movedConditions = new Set<string>()
    const visibleConditions = new Set<string>()
    const started = performance.now()
    await new Promise<void>((resolve) => {
      const sample = () => {
        const texts = surfaces.map((surface) => surface.querySelector('.settle-page')?.textContent ?? '')
        const states = surfaces.map((surface) => surface.dataset.status)
        if (new Set(texts).size !== 1 || new Set(states).size !== 1) failures.push('conditions diverged')
        surfaces.forEach((surface, index) => {
          if (surface.querySelector('.settle-unit, .settle-candidate, .settle-draft, .settle-ink, [data-pos]')) failures.push('source-position DOM leaked into whole-answer mode')
          if (states[index] !== 'complete') {
            if (texts[index]) failures.push('text appeared before source finality')
            const bars = [...surface.querySelectorAll<HTMLElement>('.ambient-composition__bar')]
            if (bars.length !== 14) failures.push('loading composition lost its authored geometry')
            if (surface.getBoundingClientRect().width > 0) {
              const condition = surface.dataset.ambientCondition!
              visibleConditions.add(condition)
              if (bars.some((bar) => bar.getBoundingClientRect().width <= 0 || bar.getBoundingClientRect().height <= 0)) failures.push('loading bar is dimensionless')
              const frame = surface.querySelector('.settle-answer-frame')!.getBoundingClientRect()
              if (frame.height < parseFloat(getComputedStyle(surface.querySelector('.settle-page')!).lineHeight) * 5 - 1) failures.push('loading frame lost its five-line minimum')
              const appearance = bars.map((bar) => `${getComputedStyle(bar).opacity}:${getComputedStyle(bar.querySelector('.ambient-composition__ink')!).clipPath}`).join('|')
              if (!firstAppearance.has(condition)) firstAppearance.set(condition, appearance)
              else if (firstAppearance.get(condition) !== appearance) movedConditions.add(condition)
            }
          } else {
            if (surface.dataset.visualReady === 'true' && surface.querySelector('.ambient-composition')) failures.push('loading composition survived visual readiness')
            if (surface.dataset.answerPhase === 'fitting' && getComputedStyle(surface.querySelector('.settle-page')!).visibility !== 'hidden') failures.push('fitting answer was partially revealed')
            if (Number(root.getAttribute('data-elapsed-ms')) < Number(root.getAttribute('data-duration-ms'))) failures.push('answer appeared before observed source deadline')
          }
        })
        if (states.every((status) => status === 'complete') && surfaces.every((surface) => surface.dataset.visualReady === 'true')) {
          finalSamples += 1
          sawArrival ||= surfaces.some((surface) => surface.querySelector('.settle-answer-arrival'))
        } else waitingSamples += 1
        if (finalSamples >= 3 || performance.now() - started > 10_000) resolve()
        else requestAnimationFrame(sample)
      }
      requestAnimationFrame(sample)
    })
    observer.disconnect()
    return { waitingSamples, finalSamples, sawArrival, textUpdates, failures, visibleConditions: [...visibleConditions], movedConditions: [...movedConditions] }
  })
  expect(observations.waitingSamples).toBeGreaterThan(0)
  expect(observations.finalSamples).toBeGreaterThan(0)
  expect(observations.sawArrival).toBe(true)
  expect(observations.textUpdates).toEqual([1, 1, 1])
  expect(observations.failures).toEqual([])
  expect(observations.movedConditions).not.toContain('static')
  for (const condition of observations.visibleConditions.filter((value) => value !== 'static')) expect(observations.movedConditions).toContain(condition)
  await page.waitForTimeout(300)
  for (const condition of ['static', 'breathe', 'reshape']) {
    const answer = study.getByRole('region', { name: `answer · ${condition}`, exact: true, includeHidden: true })
    await expect(answer).toHaveAttribute('aria-busy', 'false')
    expect(await answer.textContent()).toBe(sleep.answer)
    const shape = await answer.locator('.settle-answer-text').evaluate((ink) => ({
      children: ink.children.length,
      textNodes: [...ink.childNodes].filter((node) => node.nodeType === Node.TEXT_NODE).length,
      filter: getComputedStyle(ink).filter,
      opacity: getComputedStyle(ink).opacity,
      transform: getComputedStyle(ink).transform,
    }))
    expect(shape).toEqual({ children: 0, textNodes: 1, filter: 'none', opacity: '1', transform: 'none' })
  }
})

test('shared controls pause motion and source time, and offscreen activity rests', async ({ page }) => {
  const study = await startStudy(page)
  const controls = study.locator('.ambient-study-controls')
  await controls.getByRole('button', { name: 'pause all', exact: true }).click()
  for (const surface of await study.locator('.settle').all()) await expect(surface).toHaveAttribute('data-paused', 'true')
  const elapsed = await study.getAttribute('data-elapsed-ms')
  await page.waitForTimeout(180)
  expect(await study.getAttribute('data-elapsed-ms')).toBe(elapsed)
  expect(await study.evaluate((root) => [...root.querySelectorAll('.settle')].flatMap((surface) => surface.getAnimations({ subtree: true })).filter((animation) => animation.playState === 'running').length)).toBe(0)
  await controls.getByRole('button', { name: 'resume all', exact: true }).click()
  await expect.poll(async () => Number(await study.getAttribute('data-elapsed-ms'))).toBeGreaterThan(Number(elapsed))
  await controls.getByRole('button', { name: 'motion on', exact: true }).click()
  const toggle = controls.getByRole('button', { name: 'motion off', exact: true })
  await toggle.focus()
  await page.keyboard.press('Space')
  await expect(controls.getByRole('button', { name: 'motion on', exact: true })).toBeVisible()
  await page.keyboard.press('Space')
  for (const surface of await study.locator('.settle').all()) await expect(surface).toHaveAttribute('data-motion', 'off')
  expect(await study.evaluate((root) => [...root.querySelectorAll('.settle')].flatMap((surface) => surface.getAnimations({ subtree: true })).filter((animation) => animation.playState === 'running').length)).toBe(0)
  await controls.getByRole('button', { name: 'motion off', exact: true }).click()
  await page.locator('#open').scrollIntoViewIfNeeded()
  for (const surface of await study.locator('.settle').all()) await expect(surface).toHaveAttribute('data-active', 'false')
  expect(await study.evaluate((root) => [...root.querySelectorAll('.settle')].flatMap((surface) => surface.getAnimations({ subtree: true })).filter((animation) => animation.playState === 'running').length)).toBe(0)
})

test('the narrow comparison switches one visible condition and restarts the shared recording', async ({ page }) => {
  const study = await startStudy(page)
  const selector = study.getByRole('radiogroup', { name: 'motion study', exact: true, includeHidden: true })
  if (page.viewportSize()!.width >= 768) {
    await expect(selector).toBeHidden()
    await expect(study.locator('.settle:visible')).toHaveCount(3)
    return
  }
  await expect(selector).toBeVisible()
  for (const [condition, label] of [['static', 'still'], ['breathe', 'breathe'], ['reshape', 'reshape']]) {
    await study.getByRole('button', { name: 'to the end', exact: true }).click()
    await selector.getByRole('radio', { name: label, exact: true }).click()
    const visible = study.locator('.settle:visible')
    await expect(visible).toHaveCount(1)
    await expect(visible).toHaveAttribute('data-ambient-condition', condition)
    expect(await visible.locator('.settle-page').textContent()).toBe('')
    expect(Number(await study.getAttribute('data-elapsed-ms'))).toBeLessThan(Number(await study.getAttribute('data-duration-ms')) / 2)
    await expect(visible.locator('.ambient-composition')).toBeVisible()
  }
})

test('changing and restarting recordings cannot leak a previous answer', async ({ page }) => {
  const study = await startStudy(page)
  const recordings = study.getByRole('radiogroup', { name: 'recording', exact: true })
  await study.getByRole('button', { name: 'to the end', exact: true }).click()
  expect(await study.getByRole('region', { name: 'answer · reshape', exact: true }).textContent()).toBe(sleep.answer)
  await recordings.getByRole('radio', { name: 'a failed answer', exact: true }).click()
  await recordings.getByRole('radio', { name: 'an explanation', exact: true }).click()
  await expect(study).toHaveAttribute('data-source-id', sky.id)
  for (const page of await study.locator('.settle-page').all()) expect(await page.textContent()).toBe('')
  await study.getByRole('button', { name: 'to the end', exact: true }).click()
  for (const page of await study.locator('.settle-page').all()) expect(await page.textContent()).toBe(sky.answer)
  await study.getByRole('button', { name: 'replay all', exact: true }).click()
  for (const page of await study.locator('.settle-page').all()) expect(await page.textContent()).toBe('')
  await study.getByRole('button', { name: 'to the end', exact: true }).click()
  expect(await study.getByRole('region', { name: 'answer · reshape', exact: true }).textContent()).toBe(sky.answer)
})

test('ambient animation keeps its identity and phase through interruption; final accents do not replay', async ({ page }) => {
  const study = await startStudy(page)
  await study.getByRole('radiogroup', { name: 'clock', exact: true }).getByRole('radio', { name: '0.5× inspection', exact: true }).click()
  const surface = study.locator('.settle[data-ambient-condition="reshape"]')
  await surface.scrollIntoViewIfNeeded()
  const bar = surface.locator('.ambient-composition__bar').first()
  await expect.poll(() => bar.evaluate((el) => el.getAnimations().filter((animation) => animation.playState === 'running').length)).toBeGreaterThan(0)
  await bar.evaluate((el) => {
    const all = el.closest('.settle')!.getAnimations({ subtree: true })
    const names = ['skeleton-breathe', 'skeleton-shuffle', 'skeleton-nudge', 'skeleton-emerge', 'skeleton-glimmer', 'division-open', 'division-cell', 'division-leave', 'division-field']
    ;(el as HTMLElement & { auditAnimations: Animation[] }).auditAnimations = names.map((name) => all.find((animation) => animation instanceof CSSAnimation && animation.animationName === name)!)
  })
  await study.getByRole('button', { name: 'pause all', exact: true }).click()
  const state = () => bar.evaluate((el) => {
    const all = el.closest('.settle')!.getAnimations({ subtree: true })
    return (el as HTMLElement & { auditAnimations: Animation[] }).auditAnimations.map((animation) => ({
      same: all.includes(animation), time: Number(animation.currentTime), playState: animation.playState,
    }))
  })
  await expect.poll(async () => (await state()).every((item) => item.playState === 'paused')).toBe(true)
  // CSS pause is pending until the browser resolves its animation task.
  // Capture the held phase only after that task, not one frame before it.
  await bar.evaluate(async (el) => {
    await Promise.all((el as HTMLElement & { auditAnimations: Animation[] }).auditAnimations.map((animation) => animation.ready))
  })
  const paused = await state()
  expect(paused).toHaveLength(9)
  expect(paused.every((item) => item.same)).toBe(true)
  await page.waitForTimeout(180)
  expect(await state()).toEqual(paused)
  await study.getByRole('button', { name: 'motion on', exact: true }).click()
  await page.waitForTimeout(100)
  expect(await state()).toEqual(paused)
  await study.getByRole('button', { name: 'motion off', exact: true }).click()
  expect(await state()).toEqual(paused)
  await study.getByRole('button', { name: 'resume all', exact: true }).click()
  await surface.scrollIntoViewIfNeeded()
  await expect.poll(async () => (await state()).every((item, index) => item.same && item.time > paused[index]!.time)).toBe(true)
  await study.getByRole('button', { name: 'to the end', exact: true }).click()
  await page.waitForTimeout(400)
  await expect(study.locator('.settle-answer-arrival')).toHaveCount(0)
  await study.getByRole('button', { name: 'motion on', exact: true }).click()
  await study.getByRole('button', { name: 'motion off', exact: true }).click()
  await expect(study.locator('.settle-answer-arrival')).toHaveCount(0)
})

test('underestimated space fits before a whole opaque answer settles and becomes stationary', async ({ page, browserName, browser }, testInfo) => {
  const study = await startStudy(page)
  await study.getByRole('radiogroup', { name: 'recording', exact: true }).getByRole('radio', { name: 'an explanation', exact: true }).click()
  await expect(study).toHaveAttribute('data-source-id', sky.id)
  const surface = study.locator('.settle[data-ambient-condition="reshape"]')
  await surface.scrollIntoViewIfNeeded()
  const result = await surface.evaluate(async (root) => {
    const controls = [...root.closest('.ambient-study')!.querySelectorAll('button')]
    const end = controls.find((button) => button.textContent === 'to the end')!
    // Reset immediately before the stress trigger: slower browser setup can
    // otherwise let the natural replay allocate enough space before this test.
    controls.find((button) => button.textContent === 'replay all')!.click()
    await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())))
    const initialFrame = root.querySelector('.settle-answer-frame')!, initialPage = root.querySelector('.settle-page')!
    const minimumHeight = parseFloat(getComputedStyle(initialPage).lineHeight) * 5
    if (root.getAttribute('data-active') !== 'true' || Math.abs(initialFrame.getBoundingClientRect().height - minimumHeight) > 1) throw Error('underallocation stress requires an active fresh five-line envelope')
    const compositionBefore = root.querySelector('.ambient-composition')
    let sourceAt: number | null = null, visibleAt: number | null = null, fittingFrames = 0, visibleFrames = 0
    let initialShape: { x: number; y: number }[] | null = null, rested: { x: number; y: number }[] | null = null
    let maxShapeChange = 0, maxRestMovement = 0, restSamples = 0, sawArrival = false, observedInkDuration = 0
    const failures = new Set<string>(), translations: number[] = [], heights: number[] = []
    end.click()
    await new Promise<void>((resolve, reject) => {
      const tick = () => {
        try {
          const now = performance.now(), frame = root.querySelector('.settle-answer-frame')!, region = root.querySelector('.settle-page')!, ink = region.querySelector('.settle-answer-text')
          heights.push(frame.getBoundingClientRect().height)
          if (root.getAttribute('data-status') === 'complete' && sourceAt === null) sourceAt = now
          if (root.getAttribute('data-answer-phase') === 'fitting') {
            fittingFrames += 1
            if (getComputedStyle(region).visibility !== 'hidden' || !root.querySelector('.ambient-composition')) failures.add('fitting did not retain ornament and hide the entire answer')
            if (root.querySelector('.ambient-composition') !== compositionBefore) failures.add('fitting restarted the decorative composition')
          }
          if (ink && getComputedStyle(ink).visibility === 'visible') {
            if (visibleAt === null) visibleAt = now
            visibleFrames += 1
            const css = getComputedStyle(ink), matrix = new DOMMatrixReadOnly(css.transform)
            if (css.opacity !== '1' || css.filter !== 'none' || matrix.a !== 1 || matrix.d !== 1 || matrix.b !== 0 || matrix.c !== 0 || matrix.e !== 0 || matrix.f < -.201 || matrix.f > 1.501) failures.add('answer left its opaque vertical-settle bounds')
            if (getComputedStyle(frame).overflow !== 'visible') failures.add('readable answer was still clipped')
            translations.push(matrix.f)
            if (root.querySelector('.ambient-composition')) failures.add('ornament remained over the readable answer')
            sawArrival ||= !!root.querySelector('.settle-answer-arrival')
            const animation = ink.getAnimations().find((item) => item instanceof CSSAnimation && item.animationName === 'settle-answer-ink')
            if (animation) observedInkDuration = Number(animation.effect!.getTiming().duration)
            const node = ink.firstChild!
            const origin = region.getBoundingClientRect()
            const positions = [...node.textContent!.matchAll(/\S+/g)].map((match) => {
              const range = document.createRange(); range.setStart(node, match.index); range.setEnd(node, match.index + 1)
              const box = range.getBoundingClientRect(); return { x: box.x - origin.x, y: box.y - origin.y }
            })
            if (!initialShape) initialShape = positions
            positions.forEach((position, index) => {
              const initial = initialShape![index]!
              maxShapeChange = Math.max(maxShapeChange, Math.abs((position.x - positions[0]!.x) - (initial.x - initialShape![0]!.x)), Math.abs((position.y - positions[0]!.y) - (initial.y - initialShape![0]!.y)))
            })
            if (now - visibleAt >= 220) {
              if (!rested) rested = positions
              positions.forEach((position, index) => { maxRestMovement = Math.max(maxRestMovement, Math.hypot(position.x - rested![index]!.x, position.y - rested![index]!.y)); restSamples += 1 })
            }
            if (now - visibleAt >= 500) { resolve(); return }
          }
          if (sourceAt !== null && now - sourceAt > 2000) { reject(Error('whole answer did not become ready')); return }
          requestAnimationFrame(tick)
        } catch (error) { reject(error) }
      }
      requestAnimationFrame(tick)
    })
    const region = root.querySelector('.settle-page')!, range = document.createRange(), selection = window.getSelection()!
    // Select the text node itself; WebKit may append a block separator when
    // selecting the surrounding block element's contents.
    range.selectNodeContents(region.querySelector('.settle-answer-text')!.firstChild!); selection.removeAllRanges(); selection.addRange(range)
    const selected = selection.toString(); selection.removeAllRanges()
    return { material: compositionBefore!.getAttribute('data-material'), source: 'sky-blue__lowconf-b128-s32', firstSampledSourceCompleteMs: sourceAt, firstSampledFullyVisibleMs: visibleAt, initialFrameHeightPx: minimumHeight, actualFinalPageHeightPx: region.getBoundingClientRect().height, finalFrameHeightPx: root.querySelector('.settle-answer-frame')!.getBoundingClientRect().height, fittingFrames, visibleFrames, visualDelayMs: visibleAt! - sourceAt!, maxShapeChange, maxRestMovement, restSamples, sawArrival, observedInkDuration, minimumY: Math.min(...translations), maximumY: Math.max(...translations), heightRange: Math.max(...heights) - Math.min(...heights), selected, failures: [...failures] }
  })
  await testInfo.attach('forced-fit-result', { body: JSON.stringify({ recordedAt: new Date().toISOString(), project: testInfo.project.name, browser: browserName, browserVersion: browser.version(), viewport: page.viewportSize(), method: 'Authored underallocation stress: restart the sky recording to a verified active five-line envelope, then force its final event. Delay is first sampled source-complete to first sampled full visibility; these are browser rendering observations, not measured model or request latency.', result }, null, 2), contentType: 'application/json' })
  expect(result.failures).toEqual([])
  expect(result.fittingFrames).toBeGreaterThan(0)
  expect(result.visualDelayMs).toBeGreaterThan(100)
  expect(result.visualDelayMs).toBeLessThan(500)
  expect(result.heightRange).toBeGreaterThan(20)
  expect(result.visibleFrames).toBeGreaterThan(5)
  expect(result.observedInkDuration).toBe(180)
  expect(result.maximumY).toBeGreaterThan(.1)
  expect(result.minimumY).toBeGreaterThanOrEqual(-.201)
  expect(result.maximumY).toBeLessThanOrEqual(1.501)
  // WebKit DOM Range coordinates quantize during a uniform text transform.
  // Keep the same subpixel bound as the measurement harness; rest is separate.
  expect(result.maxShapeChange).toBeLessThan(.05)
  expect(result.restSamples).toBeGreaterThan(20)
  expect(result.maxRestMovement).toBeLessThan(.01)
  expect(result.sawArrival).toBe(true)
  expect(result.selected).toBe(sky.answer)
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1)
})

test.describe('whole answer with reduced motion', () => {
  test.use({ contextOptions: { reducedMotion: 'reduce' } })

  test('reduced motion removes movement and preserves exact shared source finality', async ({ page }) => {
    const study = await startStudy(page)
    for (const surface of await study.locator('.settle').all()) await expect(surface).toHaveAttribute('data-motion', 'off')
    expect(await study.evaluate((root) => [...root.querySelectorAll('.settle')].flatMap((surface) => surface.getAnimations({ subtree: true })).filter((animation) => animation.playState === 'running').length)).toBe(0)
    await expect(study.locator('.settle[data-status="complete"]')).toHaveCount(3, { timeout: 10_000 })
    for (const answer of await study.locator('.settle-page').all()) expect(await answer.textContent()).toBe(sleep.answer)
    expect(await study.evaluate((root) => [...root.querySelectorAll('.settle')].flatMap((surface) => surface.getAnimations({ subtree: true })).filter((animation) => animation.playState === 'running').length)).toBe(0)
  })
})

test('word bubbles make room inside anchored rows while full lines stay fixed', async ({ page }) => {
  const study = await startStudy(page)
  await study.getByRole('radiogroup', { name: 'clock', exact: true }).getByRole('radio', { name: '0.5× inspection', exact: true }).click()
  await study.getByRole('button', { name: 'replay all', exact: true }).click()
  const surface = study.locator('.settle[data-ambient-condition="reshape"]')
  await surface.scrollIntoViewIfNeeded()
  await expect(surface.locator('.ambient-composition')).toHaveAttribute('data-material', 'adaptive-cell-skeleton-v5')
  const observation = await surface.evaluate(async (el) => {
    const rows = [...el.querySelectorAll<HTMLElement>('.ambient-composition__bar')].slice(0, 5)
    const origin = el.getBoundingClientRect()
    const initial = rows.map((row) => { const box = row.getBoundingClientRect(); return { x: box.x - origin.x, y: box.y - origin.y, width: box.width, height: box.height } })
    const frame = el.querySelector('.settle-answer-frame')!
    const minimumHeight = parseFloat(getComputedStyle(el.querySelector('.settle-page')!).lineHeight) * 5
    const opacities = new Set<string>(), neighborShapes = new Set<string>()
    const newborns = new Map<number, { opacity: number[]; width: number[]; scale: number[] }>()
    const failures = new Set<string>()
    let samples = 0, glyphs = false, maxAnchorDrift = 0, minGap = Infinity
    const started = performance.now()
    await new Promise<void>((resolve) => {
      const tick = () => {
        const origin = el.getBoundingClientRect()
        rows.forEach((row, rowIndex) => {
          const box = row.getBoundingClientRect(), base = initial[rowIndex]!
          // Adaptive frame growth may adjust document scroll. Test the rows in
          // their own surface coordinates, not against the browser viewport.
          if (Math.abs(box.x - origin.x - base.x) > .05 || Math.abs(box.y - origin.y - base.y) > .05 || Math.abs(box.width - base.width) > .05 || Math.abs(box.height - base.height) > .05) failures.add('row envelope moved')
          const pills = [...row.querySelectorAll<HTMLElement>('.ambient-composition__presence')]
          const visible: DOMRect[] = []
          pills.forEach((pill, index) => {
            const ink = pill.firstElementChild!, css = getComputedStyle(ink), presence = getComputedStyle(pill), rect = ink.getBoundingClientRect()
            if (css.filter !== 'none' || css.maskImage !== 'none' || css.backgroundImage !== 'none' || css.boxShadow !== 'none' || css.clipPath !== 'none') failures.add('solid material lost')
            if (!pill.hasAttribute('data-new') && presence.opacity !== '1') failures.add('persistent neighbor disappeared')
            if (row.dataset.kind === 'line' && (Math.abs(rect.x - box.x) > .05 || Math.abs(rect.y - box.y) > .05 || Math.abs(rect.width - box.width) > .05 || Math.abs(rect.height - box.height) > .05)) failures.add('full line moved')
            if (index === 0) maxAnchorDrift = Math.max(maxAnchorDrift, Math.abs(rect.left - box.left))
            if (index === pills.length - 1) maxAnchorDrift = Math.max(maxAnchorDrift, Math.abs(rect.right - box.right))
            if (pill.hasAttribute('data-new')) {
              if (!newborns.has(rowIndex)) newborns.set(rowIndex, { opacity: [], width: [], scale: [] })
              const series = newborns.get(rowIndex)!
              series.opacity.push(Number(presence.opacity)); series.width.push(rect.width); series.scale.push(rect.height / box.height)
            } else if (pill.hasAttribute('data-moving')) neighborShapes.add(`${rowIndex}:${index}:${rect.x}:${rect.width}`)
            if (Number(presence.opacity) > .01 && rect.width > .01) visible.push(rect)
          })
          for (let i = 1; i < visible.length; i++) minGap = Math.min(minGap, visible[i]!.left - visible[i - 1]!.right)
          opacities.add(getComputedStyle(row).opacity)
        })
        if (frame.getBoundingClientRect().height < minimumHeight - 1) failures.add('loading frame lost its five-line minimum')
        glyphs ||= !!el.querySelector('.settle-answer-text')
        samples += 1
        if (performance.now() - started < 5200) requestAnimationFrame(tick)
        else resolve()
      }
      requestAnimationFrame(tick)
    })
    return { samples, opacities: opacities.size, neighborShapes: neighborShapes.size, maxAnchorDrift, minGap, glyphs,
      newborns: [...newborns.values()].map((series) => ({ minOpacity: Math.min(...series.opacity), maxOpacity: Math.max(...series.opacity), minWidth: Math.min(...series.width), maxWidth: Math.max(...series.width), minScale: Math.min(...series.scale), maxScale: Math.max(...series.scale) })), failures: [...failures] }
  })
  expect(observation.failures).toEqual([])
  expect(observation.samples).toBeGreaterThan(30)
  expect(observation.opacities).toBeGreaterThan(2)
  expect(observation.neighborShapes).toBeGreaterThan(50)
  expect(observation.maxAnchorDrift).toBeLessThan(.05)
  expect(observation.minGap).toBeGreaterThanOrEqual(-.05)
  expect(observation.newborns).toHaveLength(3)
  for (const newborn of observation.newborns) {
    expect(newborn.minOpacity).toBe(0)
    expect(newborn.maxOpacity).toBe(1)
    expect(newborn.minWidth).toBe(0)
    expect(newborn.maxWidth).toBeGreaterThan(15)
    expect(newborn.minScale).toBeGreaterThan(.819)
    expect(newborn.maxScale).toBeLessThan(1.081)
    expect(newborn.maxScale).toBeGreaterThan(1.07)
  }
  expect(observation.glyphs).toBe(false)
})


test('one capsule divides inside its frame and each cell shares the occasional glimmer', async ({ page }) => {
  const study = await startStudy(page)
  await study.getByRole('radiogroup', { name: 'clock', exact: true }).getByRole('radio', { name: '0.5× inspection', exact: true }).click()
  const surface = study.locator('.settle[data-ambient-condition="reshape"]')
  await surface.scrollIntoViewIfNeeded()
  const result = await surface.evaluate(async (el) => {
    const replay = [...el.closest('.ambient-study')!.querySelectorAll('button')].find((button) => button.textContent === 'replay all')!
    replay.click()
    let sawJoined = false, sawSplit = false, sawField = false, sawGlimmer = false, samples = 0
    const failures = new Set<string>(), glimmerPositions = new Set<string>()
    const started = performance.now()
    await new Promise<void>((resolve, reject) => {
      const tick = () => {
        try {
        const composition = el.querySelector('.ambient-composition')!
        const seed = el.querySelector<HTMLElement>('.skeleton-division')!
        const field = el.querySelector<HTMLElement>('.ambient-composition__field')!
        const seedStyle = getComputedStyle(seed), fieldStyle = getComputedStyle(field)
        const bounds = composition.getBoundingClientRect()
        const cells = [...seed.querySelectorAll('.skeleton-division__cell')].map((cell) => cell.getBoundingClientRect())
        const intro = seed.getAnimations().find((animation) => animation instanceof CSSAnimation && animation.animationName === 'division-open')!
        const time = Number(intro.currentTime)
        if (time < 114) {
          sawJoined = true
          if (Number(fieldStyle.opacity) !== 0 || seedStyle.clipPath === 'none') failures.add('joined capsule was not isolated')
        }
        if (time > 250 && time < 750 && cells[1]!.top > cells[0]!.bottom) sawSplit = true
        if (time >= 950) {
          sawField = true
          if (fieldStyle.opacity !== '1' || seedStyle.opacity !== '0' || seedStyle.visibility !== 'hidden') failures.add('division did not yield fully to the field')
        }
        cells.forEach((cell, index) => {
          if (cell.left < bounds.left - .05 || cell.right > bounds.right + .05 || cell.top < bounds.top - .05 || cell.bottom > bounds.bottom + .05) failures.add('division left its reserved area')
          if (index && cell.top < cells[index - 1]!.bottom - .05) failures.add('division cells crossed')
        })
        const inks = [...el.querySelectorAll('.ambient-composition__ink')]
        const glimmers = composition.getAnimations({ subtree: true }).filter((animation) => animation instanceof CSSAnimation && animation.animationName === 'skeleton-glimmer')
        const times = glimmers.map((animation) => Number(animation.currentTime))
        if (glimmers.length !== 43 || glimmers.some((animation) => animation.effect?.getTiming().duration !== 8000)) failures.add('incorrect glimmer clock')
        if (Math.max(...times) - Math.min(...times) > 1) failures.add('cell glimmers lost their shared phase')
        if (times[0]! >= 1280 && times[0]! <= 2080) {
          sawGlimmer = true
          glimmerPositions.add(getComputedStyle(inks[0]!, '::after').transform)
        }
        if (el.querySelector('.settle-answer-text')) failures.add('text appeared during decorative opening')
        samples += 1
        if (performance.now() - started < 2250) requestAnimationFrame(tick)
        else resolve()
        } catch (error) { reject(error) }
      }
      requestAnimationFrame(tick)
    })
    return { sawJoined, sawSplit, sawField, sawGlimmer, samples, glimmerPositions: glimmerPositions.size, failures: [...failures] }
  })
  expect(result.failures).toEqual([])
  expect(result.sawJoined).toBe(true)
  expect(result.sawSplit).toBe(true)
  expect(result.sawField).toBe(true)
  expect(result.sawGlimmer).toBe(true)
  expect(result.glimmerPositions).toBeGreaterThan(3)
  expect(result.samples).toBeGreaterThan(30)
  await study.getByRole('button', { name: 'replay all', exact: true }).click()
  await study.getByRole('button', { name: 'to the end', exact: true }).click()
  await expect(surface.locator('.ambient-composition')).toHaveCount(0)
  expect(await surface.locator('.settle-page').textContent()).toBe(sleep.answer)
})

test('the waiting envelope grows from received ink while rows and glimmer clocks keep their identities', async ({ page }) => {
  const study = await startStudy(page)
  await study.getByRole('radiogroup', { name: 'recording', exact: true }).getByRole('radio', { name: 'an explanation', exact: true }).click()
  await expect(study).toHaveAttribute('data-source-id', sky.id)
  await study.getByRole('radiogroup', { name: 'clock', exact: true }).getByRole('radio', { name: '0.5× inspection', exact: true }).click()
  const surface = study.locator('.settle[data-ambient-condition="reshape"]')
  await surface.scrollIntoViewIfNeeded()
  const result = await surface.evaluate(async (root) => {
    const rows = [...root.querySelectorAll('.ambient-composition__bar')]
    const lineHeight = parseFloat(getComputedStyle(root.querySelector('.settle-page')!).lineHeight)
    const heights: number[] = [], counts: number[] = [], failures = new Set<string>()
    let previousHeight = 0, previousCount = 5
    await new Promise<void>((resolve, reject) => {
      const started = performance.now()
      const tick = () => {
        try {
          if (root.getAttribute('data-status') === 'complete') { resolve(); return }
          const current = [...root.querySelectorAll('.ambient-composition__bar')]
          if (current.length !== 14 || current.some((row, index) => row !== rows[index])) failures.add('row nodes remounted while size changed')
          const count = current.filter((row) => row.getAttribute('data-shown') === 'true').length
          const height = root.querySelector('.settle-answer-frame')!.getBoundingClientRect().height
          if (count < previousCount || height < previousHeight - .05 || count < 5 || count > 14 || height < 5 * lineHeight - 1 || height > 14 * lineHeight + 1) failures.add('waiting envelope violated its monotonic typographic budget')
          if (root.querySelector('.settle-answer-text')) failures.add('text appeared before source finality')
          const glimmers = root.getAnimations({ subtree: true }).filter((animation) => animation instanceof CSSAnimation && animation.animationName === 'skeleton-glimmer')
          const phases = glimmers.map((animation) => Number(animation.currentTime))
          if (glimmers.length !== 43 || Math.max(...phases) - Math.min(...phases) > 1) failures.add('newly exposed rows lost their shared glimmer phase')
          previousCount = count; previousHeight = height; counts.push(count); heights.push(height)
          if (performance.now() - started > 11000) { reject(Error('long source did not complete')); return }
          requestAnimationFrame(tick)
        } catch (error) { reject(error) }
      }
      requestAnimationFrame(tick)
    })
    return { samples: heights.length, minRows: Math.min(...counts), maxRows: Math.max(...counts), heightGrowth: Math.max(...heights) - Math.min(...heights), failures: [...failures] }
  })
  expect(result.failures).toEqual([])
  expect(result.samples).toBeGreaterThan(30)
  expect(result.maxRows).toBeGreaterThan(5)
  expect(result.maxRows).toBeLessThanOrEqual(14)
  expect(result.heightGrowth).toBeGreaterThan(20)
  await expect(surface).toHaveAttribute('data-visual-ready', 'true')
  expect(await surface.locator('.settle-answer-text').textContent()).toBe(sky.answer)
})
