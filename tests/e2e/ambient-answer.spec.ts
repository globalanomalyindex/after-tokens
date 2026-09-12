import { expect, test, type Locator, type Page } from '@playwright/test'
import sleep from '../../data/experiments/parallel-qwen-2026-09-09/compact/sleep-tips__lowconf-b128-s32.json'
import sky from '../../data/experiments/parallel-qwen-2026-09-09/compact/sky-blue__lowconf-b128-s32.json'

async function startStudy(page: Page): Promise<Locator> {
  await page.goto('/')
  const study = page.locator('.ambient-study')
  await study.scrollIntoViewIfNeeded()
  await page.evaluate(() => document.fonts.ready)
  await expect(study).toHaveAttribute('data-source-id', sleep.id)
  await expect(study.locator('.settle').first()).toHaveAttribute('data-policy', 'sentence')
  await study.getByRole('radiogroup', { name: 'the page takes', exact: true }).getByRole('radio', { name: 'whole answer', exact: true }).click()
  await study.getByRole('button', { name: 'replay all', exact: true }).click()
  await expect(study.locator('.settle[data-policy="answer"]')).toHaveCount(1)
  await expect(study.locator('[role="status"][aria-live="polite"]')).toHaveCount(1)
  return study
}

test('the selected whole-answer policy preserves source finality and hands over one exact answer', async ({ page }) => {
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
            if (surface.dataset.answerPhase === 'fitting' && [...surface.querySelectorAll('[data-passage]')].some((passage) => getComputedStyle(passage).visibility !== 'hidden')) failures.push('fitting answer was partially revealed')
            if (Number(root.getAttribute('data-elapsed-ms')) < Number(root.getAttribute('data-duration-ms'))) failures.push('answer appeared before observed source deadline')
          }
        })
        sawArrival ||= surfaces.some((surface) => !!surface.querySelector('.bubble-transfer'))
        if (states.every((status) => status === 'complete') && surfaces.every((surface) => surface.dataset.visualReady === 'true')) {
          finalSamples += 1
          sawArrival ||= surfaces.some((surface) => surface.querySelector('.bubble-transfer'))
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
  expect(observations.textUpdates).toEqual([1])
  expect(observations.failures).toEqual([])
  expect(observations.movedConditions).not.toContain('static')
  for (const condition of observations.visibleConditions.filter((value) => value !== 'static')) expect(observations.movedConditions).toContain(condition)
  await page.waitForTimeout(300)
  for (const condition of ['reshape']) {
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
    expect(shape).toEqual({ children: 1, textNodes: 0, filter: 'none', opacity: '1', transform: 'none' })
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

test('the comparison switches one visible condition and restarts the shared recording at every width', async ({ page }) => {
  const study = await startStudy(page)
  const selector = study.getByRole('radiogroup', { name: 'motion study', exact: true, includeHidden: true })
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
    const names = ['skeleton-breathe', 'skeleton-glimmer', 'division-open', 'division-cell', 'division-leave', 'division-field']
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
  expect(paused).toHaveLength(6)
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
  await expect(study.locator('.bubble-transfer')).toHaveCount(0)
  await study.getByRole('button', { name: 'motion on', exact: true }).click()
  await study.getByRole('button', { name: 'motion off', exact: true }).click()
  await expect(study.locator('.bubble-transfer')).toHaveCount(0)
})

test('authored narrow underallocation fits before a bounded bubble-to-word handover', async ({ page }, testInfo) => {
  const study = await startStudy(page)
  await study.getByRole('radiogroup', { name: 'recording', exact: true }).getByRole('radio', { name: 'an explanation', exact: true }).click()
  const surface = study.locator('.settle[data-ambient-condition="reshape"]')
  // Fixed narrow width is an explicit stress fixture at every browser viewport.
  await surface.evaluate((root) => { (root as HTMLElement).style.width = '240px' })
  await surface.scrollIntoViewIfNeeded()
  const result = await surface.evaluate(async (root) => {
    const controls = [...root.closest('.ambient-study')!.querySelectorAll('button')]
    controls.find((button) => button.textContent === 'replay all')!.click()
    await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())))
    const frame = root.querySelector('.settle-answer-frame')!, composition = root.querySelector('.ambient-composition')
    // Isolate the fit/transfer branch from the separate early-intro fallback:
    // advance only the authored intro, leaving source time and five rows fresh.
    for (const animation of root.getAnimations({ subtree: true })) if (animation instanceof CSSAnimation && animation.animationName.startsWith('division-')) animation.currentTime = 950
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
    const initialHeight = frame.getBoundingClientRect().height
    let sourceAt: number | null = null, opaqueAt: number | null = null, restAt: number | null = null
    let fittingFrames = 0, blendFrames = 0, transferFrames = 0, minOpacity = 1, maxOpacity = 0, maxTop = 0, minTop = 0, duration = 0
    let firstRest: number[][] | null = null, restSamples = 0, restMovement = 0
    const failures = new Set<string>()
    controls.find((button) => button.textContent === 'to the end')!.click()
    await new Promise<void>((resolve, reject) => {
      const started = performance.now()
      const tick = () => {
        try {
          const now = performance.now(), passage = root.querySelector<HTMLElement>('[data-passage]'), region = root.querySelector('.settle-page')!
          if (root.getAttribute('data-status') === 'complete' && sourceAt === null) sourceAt = now
          if (root.getAttribute('data-answer-phase') === 'fitting') {
            fittingFrames++
            if (!passage || getComputedStyle(passage).visibility !== 'hidden' || root.querySelector('.ambient-composition') !== composition) failures.add('underfit exposed text or restarted the material')
          }
          if (passage && getComputedStyle(passage).visibility === 'visible') {
            const css = getComputedStyle(passage), opacity = Number(css.opacity), top = parseFloat(css.top)
            minOpacity = Math.min(minOpacity, opacity); maxOpacity = Math.max(maxOpacity, opacity); maxTop = Math.max(maxTop, top); minTop = Math.min(minTop, top)
            if (css.filter !== 'none' || css.transform !== 'none' || top > 1.501 || top < -.201) failures.add('new words left the bounded no-blur handover')
            if (opacity > .01 && opacity < .99) blendFrames++
            const transfer = root.querySelector('.bubble-transfer')
            if (transfer?.querySelector('.bubble-transfer__cell')) transferFrames++
            const animation = passage.getAnimations().find((item) => item instanceof CSSAnimation && item.animationName === 'reading-ink-arrive')
            if (animation) duration = Number(animation.effect!.getTiming().duration)
            if (opacity >= .999 && opaqueAt === null) opaqueAt = now
            if (root.getAttribute('data-visual-ready') === 'true') {
              if (restAt === null) restAt = now
              if (transfer || root.querySelector('.ambient-composition')) failures.add('material survived finished handover')
              const node = passage.firstChild!, origin = region.getBoundingClientRect()
              const positions = [...node.textContent!.matchAll(/\S+/g)].map((match) => {
                const range = document.createRange(); range.setStart(node, match.index!); range.setEnd(node, match.index! + 1)
                const rect = range.getBoundingClientRect(); return [rect.x - origin.x, rect.y - origin.y]
              })
              firstRest ??= positions
              positions.forEach((position, index) => { restMovement = Math.max(restMovement, Math.hypot(position[0]! - firstRest![index]![0]!, position[1]! - firstRest![index]![1]!)) })
              restSamples++
              if (now - restAt > 300) { resolve(); return }
            }
          }
          if (now - started > 3000) { reject(Error('forced finality never completed its handover')); return }
          requestAnimationFrame(tick)
        } catch (error) { reject(error) }
      }
      requestAnimationFrame(tick)
    })
    return { fittingFrames, blendFrames, transferFrames, minOpacity, maxOpacity, minTop, maxTop, duration, initialHeight,
      finalHeight: frame.getBoundingClientRect().height, finalText: root.querySelector('.settle-page')!.textContent,
      sourceToOpaqueMs: opaqueAt! - sourceAt!, sourceToRestMs: restAt! - sourceAt!, restSamples, restMovement, failures: [...failures] }
  })
  await testInfo.attach('v8-forced-fit-result', { body: JSON.stringify(result, null, 2), contentType: 'application/json' })
  expect(result.failures).toEqual([])
  expect(result.fittingFrames).toBeGreaterThan(0)
  expect(result.blendFrames).toBeGreaterThan(1)
  expect(result.transferFrames).toBeGreaterThan(1)
  expect(result.duration).toBe(280)
  expect(result.minOpacity).toBeLessThan(.5)
  expect(result.maxOpacity).toBe(1)
  expect(result.maxTop).toBeGreaterThan(.1)
  expect(result.sourceToOpaqueMs).toBeGreaterThan(180)
  expect(result.sourceToRestMs).toBeLessThan(900)
  expect(result.restSamples).toBeGreaterThan(5)
  expect(result.restMovement).toBeLessThan(.01)
  expect(result.finalHeight).toBeGreaterThan(result.initialHeight + 20)
  expect(result.finalText).toBe(sky.answer)
})

test.describe('whole answer with reduced motion', () => {
  test.use({ contextOptions: { reducedMotion: 'reduce' } })

  test('reduced motion removes movement and preserves exact shared source finality', async ({ page }) => {
    const study = await startStudy(page)
    for (const surface of await study.locator('.settle').all()) await expect(surface).toHaveAttribute('data-motion', 'off')
    expect(await study.evaluate((root) => [...root.querySelectorAll('.settle')].flatMap((surface) => surface.getAnimations({ subtree: true })).filter((animation) => animation.playState === 'running').length)).toBe(0)
    await expect(study.locator('.settle[data-status="complete"]')).toHaveCount(1, { timeout: 10_000 })
    for (const answer of await study.locator('.settle-page').all()) expect(await answer.textContent()).toBe(sleep.answer)
    expect(await study.evaluate((root) => [...root.querySelectorAll('.settle')].flatMap((surface) => surface.getAnimations({ subtree: true })).filter((animation) => animation.playState === 'running').length)).toBe(0)
  })
})

test('seeded cells evolve inside left-anchored rows without lexical placeholders or overlap', async ({ page }) => {
  const study = await startStudy(page)
  await study.getByRole('radiogroup', { name: 'clock', exact: true }).getByRole('radio', { name: '0.5× inspection', exact: true }).click()
  const surface = study.locator('.settle[data-ambient-condition="reshape"]')
  await surface.scrollIntoViewIfNeeded()
  await expect(surface).toHaveAttribute('data-material', 'growing-cell-skeleton-v8')
  const result = await surface.evaluate(async (root) => {
    const rows = [...root.querySelectorAll<HTMLElement>('.ambient-composition__bar')], cells = [...root.querySelectorAll('.ambient-composition__presence')]
    const shapes = new Set<string>(), periods = new Set<string>(), failures = new Set<string>()
    let samples = 0, minGap = Infinity, leftDrift = 0
    const activityStart = Number(root.querySelector('.ambient-composition')!.getAttribute('data-activity-ms'))
    const started = performance.now()
    await new Promise<void>((resolve) => {
      const tick = () => {
        const composition = root.querySelector('.ambient-composition')!, origin = composition.getBoundingClientRect()
        const currentCells = [...root.querySelectorAll('.ambient-composition__presence')]
        if (currentCells.length !== cells.length || currentCells.some((cell, index) => cell !== cells[index])) failures.add('cell identity changed')
        for (const row of rows.filter((row) => row.dataset.shown === 'true')) {
          const box = row.getBoundingClientRect()
          leftDrift = Math.max(leftDrift, Math.abs(box.left - origin.left))
          const css = getComputedStyle(row); periods.add(css.animationDuration)
          const visible = [...row.querySelectorAll<HTMLElement>('.ambient-composition__presence')].map((cell) => ({ css: getComputedStyle(cell), rect: cell.getBoundingClientRect(), ink: getComputedStyle(cell.firstElementChild!) })).filter((cell) => Number(cell.css.opacity) > .01 && cell.rect.width > .01)
          visible.forEach((cell, index) => {
            if (cell.ink.filter !== 'none' || cell.ink.backgroundImage !== 'none' || cell.ink.boxShadow !== 'none' || cell.ink.maskImage !== 'none') failures.add('solid capsule gained an effect')
            if (index) minGap = Math.min(minGap, cell.rect.left - visible[index - 1]!.rect.right)
            shapes.add(`${row.dataset.row}:${index}:${cell.rect.left - box.left}:${cell.rect.width}:${cell.css.opacity}`)
          })
        }
        if (root.querySelector('.settle-page')?.textContent) failures.add('words appeared before whole-answer finality')
        samples++
        if (performance.now() - started < 3400) requestAnimationFrame(tick)
        else resolve()
      }
      requestAnimationFrame(tick)
    })
    return { samples, minGap, leftDrift, shapes: shapes.size, periods: periods.size,
      activityAdvance: Number(root.querySelector('.ambient-composition')!.getAttribute('data-activity-ms')) - activityStart, failures: [...failures] }
  })
  expect(result.failures).toEqual([])
  expect(result.samples).toBeGreaterThan(20)
  expect(result.shapes).toBeGreaterThan(50)
  expect(result.periods).toBeGreaterThan(2)
  expect(result.leftDrift).toBeLessThan(.05)
  expect(result.minGap).toBeGreaterThanOrEqual(-.05)
  expect(result.activityAdvance).toBeGreaterThan(1000)
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
        if (glimmers.length !== inks.length || glimmers.some((animation) => animation.effect?.getTiming().duration !== 8000)) failures.add('incorrect glimmer clock')
        if (Math.max(...times) - Math.min(...times) > 1) failures.add('cell glimmers lost their shared phase')
        if (times[0]! >= 1280 && times[0]! <= 2080) {
          sawGlimmer = true
          glimmerPositions.add(getComputedStyle(inks[0]!, '::after').transform)
        }
        if (el.querySelector('.settle-page')?.textContent) failures.add('text appeared during decorative opening')
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

test('the waiting capacity grows from received ink while authored row widths and identities remain stable', async ({ page }) => {
  const study = await startStudy(page)
  await study.getByRole('radiogroup', { name: 'recording', exact: true }).getByRole('radio', { name: 'an explanation', exact: true }).click()
  await expect(study).toHaveAttribute('data-source-id', sky.id)
  await study.getByRole('radiogroup', { name: 'clock', exact: true }).getByRole('radio', { name: '0.5× inspection', exact: true }).click()
  const surface = study.locator('.settle[data-ambient-condition="reshape"]')
  await surface.evaluate((root) => { (root as HTMLElement).style.width = '240px' })
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
          if (current.length !== 14 || current.some((row, index) => row !== rows[index])) failures.add('row nodes remounted while waiting')
          const count = current.filter((row) => row.getAttribute('data-shown') === 'true').length
          const height = root.querySelector('.settle-answer-frame')!.getBoundingClientRect().height
          if (count < previousCount || height < previousHeight - .05 || count < 5 || count > 14 || height < 5 * lineHeight - 1 || height > 14 * lineHeight + 1) failures.add('waiting capacity exceeded its monotonic budget')
          if (root.querySelector('.settle-page')?.textContent) failures.add('text appeared before source finality')
          const glimmers = root.getAnimations({ subtree: true }).filter((animation) => animation instanceof CSSAnimation && animation.animationName === 'skeleton-glimmer')
          const phases = glimmers.map((animation) => Number(animation.currentTime))
          if (glimmers.length !== root.querySelectorAll('.ambient-composition__ink').length || Math.max(...phases) - Math.min(...phases) > 1) failures.add('newly exposed rows lost their shared glimmer phase')
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
  expect(result.minRows).toBeGreaterThanOrEqual(5)
  expect(result.maxRows).toBeGreaterThan(5)
  expect(result.maxRows).toBeLessThanOrEqual(14)
  expect(result.heightGrowth).toBeGreaterThan(20)
  await expect(surface).toHaveAttribute('data-visual-ready', 'true')
  expect(await surface.locator('.settle-answer-text').textContent()).toBe(sky.answer)
})

test('an answer released during the joined opening fades the intact capsule without cloning slabs', async ({ page }) => {
  const study = await startStudy(page)
  const surface = study.locator('.settle[data-ambient-condition="reshape"]')
  await surface.scrollIntoViewIfNeeded()
  const result = await surface.evaluate(async (root) => {
    const controls = [...root.closest('.ambient-study')!.querySelectorAll('button')]
    controls.find((button) => button.textContent === 'replay all')!.click()
    await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())))
    controls.find((button) => button.textContent === 'to the end')!.click()
    let fadedField = false, blendedInk = false, maximumCopies = 0
    await new Promise<void>((resolve) => {
      const started = performance.now()
      const tick = () => {
        const field = root.querySelector('.settle-waiting-field'), passage = root.querySelector('[data-passage]')
        if (field) { const opacity = Number(getComputedStyle(field).opacity); fadedField ||= opacity > 0 && opacity < 1 }
        if (passage) { const opacity = Number(getComputedStyle(passage).opacity); blendedInk ||= opacity > 0 && opacity < 1 }
        maximumCopies = Math.max(maximumCopies, root.querySelectorAll('.bubble-transfer__cell').length)
        if (root.getAttribute('data-visual-ready') === 'true' || performance.now() - started > 1500) resolve()
        else requestAnimationFrame(tick)
      }
      requestAnimationFrame(tick)
    })
    return { fadedField, blendedInk, maximumCopies, ready: root.getAttribute('data-visual-ready') }
  })
  expect(result).toEqual({ fadedField: true, blendedInk: true, maximumCopies: 0, ready: 'true' })
})
