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

test('three ambient conditions share one source and reveal one exact answer at finality', async ({ page }) => {
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
            if (bars.length !== 5) failures.push('loading composition lost its authored geometry')
            if (surface.getBoundingClientRect().width > 0) {
              const condition = surface.dataset.ambientCondition!
              visibleConditions.add(condition)
              if (bars.some((bar) => bar.getBoundingClientRect().width <= 0 || bar.getBoundingClientRect().height <= 0)) failures.push('loading bar is dimensionless')
              const frame = surface.querySelector('.settle-answer-frame')!.getBoundingClientRect()
              if (frame.height < parseFloat(getComputedStyle(surface).fontSize) * 7.99) failures.push('loading frame lost its 8em allocation')
              const appearance = bars.map((bar) => `${getComputedStyle(bar).opacity}:${getComputedStyle(bar.querySelector('.ambient-composition__ink')!).clipPath}`).join('|')
              if (!firstAppearance.has(condition)) firstAppearance.set(condition, appearance)
              else if (firstAppearance.get(condition) !== appearance) movedConditions.add(condition)
            }
          } else {
            if (surface.querySelector('.ambient-composition')) failures.push('loading composition survived finality')
            if (Number(root.getAttribute('data-elapsed-ms')) < Number(root.getAttribute('data-duration-ms'))) failures.push('answer appeared before observed source deadline')
          }
        })
        if (states.every((status) => status === 'complete')) {
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
    const animation = el.getAnimations().find((item) => item instanceof CSSAnimation && item.animationName === 'skeleton-breathe')!
    ;(el as HTMLElement & { auditAnimation: Animation }).auditAnimation = animation
    ;(el as HTMLElement & { auditShape: Animation }).auditShape = el.firstElementChild!.getAnimations().find((item) => item instanceof CSSAnimation && item.animationName === 'skeleton-reshape')!
  })
  await study.getByRole('button', { name: 'pause all', exact: true }).click()
  const state = () => bar.evaluate((el) => {
    const animation = (el as HTMLElement & { auditAnimation: Animation }).auditAnimation
    const shape = (el as HTMLElement & { auditShape: Animation }).auditShape
    return { same: el.getAnimations().includes(animation), time: Number(animation.currentTime), playState: animation.playState, shapeSame: el.firstElementChild!.getAnimations().includes(shape), shapeTime: Number(shape.currentTime), shapeState: shape.playState }
  })
  await expect.poll(async () => (await state()).playState).toBe('paused')
  const paused = await state()
  await page.waitForTimeout(180)
  expect(await state()).toEqual(paused)
  expect(paused.same).toBe(true)
  expect(paused.shapeSame).toBe(true)
  expect(paused.shapeState).toBe('paused')
  await study.getByRole('button', { name: 'motion on', exact: true }).click()
  await page.waitForTimeout(100)
  expect(await state()).toEqual(paused)
  await study.getByRole('button', { name: 'motion off', exact: true }).click()
  expect(await state()).toEqual(paused)
  await study.getByRole('button', { name: 'resume all', exact: true }).click()
  await surface.scrollIntoViewIfNeeded()
  await expect.poll(async () => (await state()).time).toBeGreaterThan(paused.time)
  expect((await state()).same).toBe(true)
  expect((await state()).shapeSame).toBe(true)
  expect((await state()).shapeTime).toBeGreaterThan(paused.shapeTime)
  await study.getByRole('button', { name: 'to the end', exact: true }).click()
  await page.waitForTimeout(400)
  await expect(study.locator('.settle-answer-arrival')).toHaveCount(0)
  await study.getByRole('button', { name: 'motion on', exact: true }).click()
  await study.getByRole('button', { name: 'motion off', exact: true }).click()
  await expect(study.locator('.settle-answer-arrival')).toHaveCount(0)
})

test('whole-answer text stays selectable and still while its separate arrival decoration plays', async ({ page }) => {
  const study = await startStudy(page)
  const answer = study.getByRole('region', { name: 'answer · reshape', exact: true })
  await study.getByRole('button', { name: 'to the end', exact: true }).click()
  await answer.scrollIntoViewIfNeeded()
  const result = await answer.evaluate(async (region) => {
    const ink = region.querySelector('.settle-answer-text')!
    const node = ink.firstChild!
    const range = document.createRange()
    range.setStart(node, 0)
    range.setEnd(node, 1)
    const first = range.getBoundingClientRect()
    const origin = region.getBoundingClientRect()
    let maxMove = 0
    let samples = 0
    const started = performance.now()
    await new Promise<void>((resolve) => {
      const tick = () => {
        const rect = range.getBoundingClientRect()
        const parent = region.getBoundingClientRect()
        maxMove = Math.max(maxMove, Math.hypot((rect.x - parent.x) - (first.x - origin.x), (rect.y - parent.y) - (first.y - origin.y)))
        samples += 1
        if (performance.now() - started < 450) requestAnimationFrame(tick)
        else resolve()
      }
      requestAnimationFrame(tick)
    })
    range.selectNodeContents(region)
    const selection = window.getSelection()!
    selection.removeAllRanges()
    selection.addRange(range)
    const selected = selection.toString()
    selection.removeAllRanges()
    return { samples, maxMove, selected }
  })
  expect(result.samples).toBeGreaterThan(2)
  expect(result.maxMove).toBe(0)
  expect(result.selected).toBe(sleep.answer)
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

test('solid skeletons keep crisp circular ends and fixed thickness through a full motion cycle', async ({ page }) => {
  const study = await startStudy(page)
  await study.getByRole('radiogroup', { name: 'clock', exact: true }).getByRole('radio', { name: '0.5× inspection', exact: true }).click()
  await study.getByRole('button', { name: 'replay all', exact: true }).click()
  const active = await study.getAttribute('data-active-condition')
  const surface = study.locator(`.settle[data-ambient-condition="${active}"]`)
  const ink = surface.locator('.ambient-composition__ink').first()
  await expect(ink).toBeVisible()
  const material = await ink.evaluate((el) => {
    const css = getComputedStyle(el)
    return { mask: css.maskImage, image: css.backgroundImage, filter: css.filter, shadow: css.boxShadow, radius: css.borderTopLeftRadius }
  })
  expect(material).toMatchObject({ mask: 'none', image: 'none', filter: 'none', shadow: 'none' })
  expect(parseFloat(material.radius)).toBeGreaterThan(0)
  const observation = await surface.evaluate(async (el) => {
    const inks = [...el.querySelectorAll<HTMLElement>('.ambient-composition__ink')]
    const frame = el.querySelector('.settle-answer-frame')!
    const heights = inks.map((item) => item.getBoundingClientRect().height)
    const frameHeight = frame.getBoundingClientRect().height
    const clips = new Set<string>()
    const opacities = new Set<string>()
    let heightChange = 0
    let samples = 0
    let glyphs = false
    const started = performance.now()
    await new Promise<void>((resolve) => {
      const tick = () => {
        inks.forEach((item, index) => {
          heightChange = Math.max(heightChange, Math.abs(item.getBoundingClientRect().height - heights[index]!))
          clips.add(getComputedStyle(item).clipPath)
          opacities.add(getComputedStyle(item.parentElement!).opacity)
        })
        heightChange = Math.max(heightChange, Math.abs(frame.getBoundingClientRect().height - frameHeight))
        glyphs ||= !!el.querySelector('.settle-answer-text')
        samples += 1
        if (performance.now() - started < 5200) requestAnimationFrame(tick)
        else resolve()
      }
      requestAnimationFrame(tick)
    })
    return { samples, clips: clips.size, opacities: opacities.size, heightChange, glyphs }
  })
  expect(observation.samples).toBeGreaterThan(30)
  expect(observation.clips).toBeGreaterThan(2)
  expect(observation.opacities).toBeGreaterThan(2)
  expect(observation.heightChange).toBe(0)
  expect(observation.glyphs).toBe(false)
})
