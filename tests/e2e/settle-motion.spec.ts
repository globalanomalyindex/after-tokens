import { expect, test, type Locator, type Page } from '@playwright/test'
import weather from '../../data/traces/compact/weather__random-b32.json'
import sky from '../../data/traces/compact/sky-blue__lowconf-b128.json'

async function startEarlierWords(page: Page): Promise<Locator> {
  await page.goto('/')
  const hook = page.locator('#playground')
  await hook.scrollIntoViewIfNeeded()
  await hook.getByRole('radiogroup', { name: 'sampler', exact: true }).getByRole('radio', { name: 'random · 4 blocks', exact: true }).click()
  await hook.getByRole('radiogroup', { name: 'Prompt', exact: true }).getByRole('radio', { name: weather.prompt, exact: true }).click()
  await hook.getByRole('radio', { name: 'each sentence', exact: true }).click()
  await hook.getByRole('radio', { name: 'recorded', exact: true }).click()
  const surface = hook.locator('.settle').first()
  await surface.scrollIntoViewIfNeeded()
  await expect(surface.locator('.ambient-composition')).toBeAttached()
  await expect(surface).toHaveAttribute('data-material', 'ambient-cell-skeleton-v7')
  await expect(surface).toHaveAttribute('data-ambient-condition', 'reshape')
  await page.evaluate(() => document.fonts.ready)
  await hook.getByRole('button', { name: 'replay the recording', exact: true }).click()
  return surface
}

test('earlier reading hands over only released passages and never reanimates settled words', async ({ page }, testInfo) => {
  const surface = await startEarlierWords(page)
  const observation = await surface.evaluate(async (root) => {
    const known = new Map<string, { el: Element; rest: boolean; positions: number[][]; viewportPositions: number[][] }>(), failures = new Set<string>()
    let batches = 0, restingSamples = 0, materialSamples = 0, blendSamples = 0, maxRestDrift = 0, maximumTransferCells = 0, coherentRestSamples = 0, discardedIncoherentSamples = 0, maxViewportDrift = 0, maximumIntraSampleScrollPx = 0
    const drifts: object[] = []
    const transfers = new WeakSet<Element>(), started = performance.now()
    await new Promise<void>((resolve, reject) => {
      const tick = () => {
        try {
          const origin = root.querySelector('.settle-page')!.getBoundingClientRect(), scrollBefore = scrollY
          const passages = [...root.querySelectorAll<HTMLElement>('[data-passage]')]
          if ((root.querySelector('.settle-page')?.textContent?.length ?? 0) !== Number(root.getAttribute('data-released-length'))) failures.add('DOM differs from policy-released length')
          if (root.querySelector('.settle-unit, .settle-candidate, .settle-draft, .settle-ink, .settle-field, .settle-mark')) failures.add('legacy renderer leaked')
          if (root.getAttribute('data-status') === 'receiving' && root.querySelector('.ambient-composition')) materialSamples++
          const transfer = root.querySelector('.bubble-transfer')
          if (root.getAttribute('data-status') === 'receiving') maximumTransferCells = Math.max(maximumTransferCells, transfer?.querySelectorAll('.bubble-transfer__cell').length ?? 0)
          if (transfer && !transfers.has(transfer)) { transfers.add(transfer); batches++ }
          for (const passage of passages) {
            const id = passage.dataset.passage!, css = getComputedStyle(passage), old = known.get(id)
            const resting = !passage.hasAttribute('data-arriving') && !passage.hasAttribute('data-pending')
            if (old && old.el !== passage) failures.add('released passage remounted')
            if (old?.rest && !resting) failures.add('earlier passage reanimated')
            if (css.filter !== 'none' || css.transform !== 'none') failures.add('blur or transform on reading ink')
            if (Number(css.opacity) > .01 && Number(css.opacity) < .99) blendSamples++
            let positions: number[][] = []
            const viewportPositions: number[][] = []
            if (resting) {
              restingSamples++
              if (Number(css.opacity) !== 1 || css.visibility !== 'visible' || parseFloat(css.top) !== 0) failures.add('settled text stopped being readable')
              const node = passage.firstChild!
              positions = [...node.textContent!.matchAll(/\S+/g)].map((match) => {
                const range = document.createRange(); range.setStart(node, match.index!); range.setEnd(node, match.index! + 1)
                const rect = range.getBoundingClientRect(); viewportPositions.push([rect.left, rect.top]); return [rect.left - origin.left, rect.top - origin.top]
              })
              // WebKit can apply scroll anchoring during a geometry read. A
              // viewport origin sampled before that flush cannot be paired
              // with glyphs sampled after it. Reject that incoherent sample;
              // keep the previous coherent baseline and the same tolerance.
              const afterGeometry = root.querySelector('.settle-page')!.getBoundingClientRect()
              maximumIntraSampleScrollPx = Math.max(maximumIntraSampleScrollPx, Math.abs(scrollY - scrollBefore))
              if (old?.rest && old.viewportPositions.length === viewportPositions.length) viewportPositions.forEach((position, index) => { maxViewportDrift = Math.max(maxViewportDrift, Math.hypot(position[0]! - old.viewportPositions[index]![0]!, position[1]! - old.viewportPositions[index]![1]!)) })
              const coherent = Math.abs(afterGeometry.x - origin.x) < .001 && Math.abs(afterGeometry.y - origin.y) < .001
              if (!coherent) { discardedIncoherentSamples++; positions = old?.positions ?? [] }
              else coherentRestSamples++
              if (coherent && old?.rest && old.positions.length === positions.length) positions.forEach((position, index) => {
                const delta = Math.hypot(position[0]! - old.positions[index]![0]!, position[1]! - old.positions[index]![1]!)
                maxRestDrift = Math.max(maxRestDrift, delta)
                if (delta > .05 && drifts.length < 12) {
                  const ancestors = []
                  for (let parent = passage.parentElement; parent; parent = parent.parentElement) {
                    const style = getComputedStyle(parent)
                    if (style.transform !== 'none') ancestors.push({ class: parent.className, transform: style.transform })
                  }
                  const after = root.querySelector('.settle-page')!.getBoundingClientRect()
                  drifts.push({ delta, id, word: index, text: passage.textContent, before: old.positions[index], after: position, top: css.top,
                    font: css.font, pageBefore: { x: origin.x, y: origin.y, width: origin.width }, pageAfter: { x: after.x, y: after.y, width: after.width }, scrollY, ancestors })
                }
              })
            }
            known.set(id, { el: passage, rest: resting, positions: old?.rest && old.positions.length ? old.positions : positions, viewportPositions: old?.rest && old.viewportPositions.length ? old.viewportPositions : viewportPositions })
          }
          if (performance.now() - started < 10000) requestAnimationFrame(tick)
          else resolve()
        } catch (error) { reject(error) }
      }
      requestAnimationFrame(tick)
    })
    return { failures: [...failures], batches, restingSamples, materialSamples, blendSamples, maxRestDrift, maximumTransferCells, coherentRestSamples, discardedIncoherentSamples, maxViewportDrift, maximumIntraSampleScrollPx, distinctPassages: known.size, drifts }
  })
  await testInfo.attach('v7-earlier-reading-result', { body: JSON.stringify(observation, null, 2), contentType: 'application/json' })
  expect(observation.maximumTransferCells).toBeLessThanOrEqual(6)
  expect(observation.failures).toEqual([])
  expect(observation.batches).toBeGreaterThanOrEqual(2)
  expect(observation.distinctPassages).toBeGreaterThanOrEqual(2)
  expect(observation.restingSamples).toBeGreaterThan(0)
  expect(observation.materialSamples).toBeGreaterThan(0)
  expect(observation.blendSamples).toBeGreaterThan(0)
  expect(observation.coherentRestSamples).toBeGreaterThan(50)
  expect(observation.discardedIncoherentSamples / observation.restingSamples).toBeLessThan(.25)
  expect(observation.maxRestDrift).toBeLessThan(.05)
})

test('pause and offscreen states suspend ambient activity without resetting its phase', async ({ page }) => {
  const surface = await startEarlierWords(page)
  const ambient = surface.locator('.ambient-composition__bar').first()
  await expect(surface).toHaveAttribute('data-active', 'true')
  await expect(ambient).toBeAttached()
  const delay = await ambient.evaluate((el) => getComputedStyle(el).animationDelay)
  await page.locator('#playground').getByRole('button', { name: 'pause the replay', exact: true }).click()
  await expect(surface).toHaveAttribute('data-paused', 'true')
  await expect(surface).toHaveAttribute('data-active', 'false')
  await expect.poll(() => ambient.evaluate((el) => getComputedStyle(el).animationPlayState)).toBe('paused')
  const pausedText = await surface.locator('.settle-page').textContent()
  await page.waitForTimeout(150)
  expect(await surface.locator('.settle-page').textContent()).toBe(pausedText)
  expect(await ambient.evaluate((el) => getComputedStyle(el).animationDelay)).toBe(delay)
  await page.locator('#playground').getByRole('button', { name: 'resume the replay', exact: true }).click()
  await expect(surface).toHaveAttribute('data-active', 'true')
  await page.locator('#open').scrollIntoViewIfNeeded()
  await expect(surface).toHaveAttribute('data-active', 'false')
  const running = await surface.evaluate((root) => root.getAnimations({ subtree: true }).filter((animation) => animation.playState === 'running').map((animation) => ({
    type: animation.constructor.name,
    target: (animation.effect as KeyframeEffect)?.target instanceof Element ? ((animation.effect as KeyframeEffect).target as Element).className : '',
  })))
  expect(running).toEqual([])
})

test('a finished real recording is exact, selectable and stationary', async ({ page }) => {
  test.setTimeout(60_000)
  const surface = await startEarlierWords(page)
  await expect(surface).toHaveAttribute('data-status', 'complete', { timeout: 45_000 })
  await expect(surface).toHaveAttribute('data-active', 'false')
  await expect(surface).toHaveAttribute('data-visual-ready', 'true')
  expect(await surface.locator('.settle-page').textContent()).toBe(weather.answer)
  const selected = await surface.locator('.settle-page').evaluate((el) => {
    const range = document.createRange()
    const nodes: Node[] = [], walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT)
    let node: Node | null
    while ((node = walker.nextNode())) nodes.push(node)
    range.setStart(nodes[0]!, 0); range.setEnd(nodes.at(-1)!, nodes.at(-1)!.textContent!.length)
    const selection = window.getSelection()!
    selection.removeAllRanges()
    selection.addRange(range)
    const text = selection.toString()
    selection.removeAllRanges()
    return text
  })
  expect(selected).toBe(weather.answer)
  await page.waitForTimeout(450)
  const positions = () => surface.locator('[data-passage]').evaluateAll((elements) => elements.map((el) => {
    const rect = el.getClientRects()[0] ?? el.getBoundingClientRect()
    return [rect.left, rect.top]
  }))
  const before = await positions()
  expect(before.length).toBeGreaterThan(0)
  await page.waitForTimeout(250)
  expect(await positions()).toEqual(before)
  expect(await surface.evaluate((root) => root.getAnimations({ subtree: true }).filter((animation) => animation.playState === 'running').length)).toBe(0)
})

test('motion off cancels decoration while the recorded source keeps advancing', async ({ page }) => {
  const surface = await startEarlierWords(page)
  await page.locator('#playground').getByRole('button', { name: 'motion on', exact: true }).click()
  await expect(surface).toHaveAttribute('data-motion', 'off')
  await page.locator('#playground').getByRole('button', { name: 'motion off', exact: true }).focus()
  await page.keyboard.press('Space')
  await expect(surface).toHaveAttribute('data-motion', 'on')
  await page.keyboard.press('Space')
  await expect(surface).toHaveAttribute('data-motion', 'off')
  const before = Number(await surface.getAttribute('data-source-at-ms'))
  await expect.poll(async () => Number(await surface.getAttribute('data-source-at-ms')), { timeout: 6000 }).toBeGreaterThan(before)
  await expect(surface.locator('.bubble-transfer, [data-arriving], [data-pending]')).toHaveCount(0)
  expect(await surface.evaluate((root) => root.getAnimations({ subtree: true }).filter((animation) => animation.playState === 'running').length)).toBe(0)
})

test('the embedded phone preserves its answer width and exact final text', async ({ page }) => {
  test.setTimeout(60_000)
  await page.goto('/')
  const previews = page.locator('#previews')
  const surface = previews.locator('.settle').nth(2)
  await surface.scrollIntoViewIfNeeded()
  await previews.getByRole('button', { name: 'Replay a phone, felt voice', exact: true }).click()
  const widths = await surface.evaluate(async (root) => {
    const values: number[] = []
    const started = performance.now()
    await new Promise<void>((resolve) => {
      const tick = () => {
        values.push(root.getBoundingClientRect().width)
        if (performance.now() - started < 3000) requestAnimationFrame(tick)
        else resolve()
      }
      requestAnimationFrame(tick)
    })
    return values
  })
  expect(widths.length).toBeGreaterThan(2)
  expect(Math.max(...widths) - Math.min(...widths)).toBeLessThan(1)
  expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(1)
  await expect(surface).toHaveAttribute('data-status', 'complete', { timeout: 45_000 })
  await expect(surface).toHaveAttribute('data-visual-ready', 'true')
  await expect(surface.locator('.settle-answer-text')).toBeVisible()
  expect(await surface.locator('.settle-page').textContent()).toBe(sky.answer)
})

for (const policy of ['whole answer', 'each word', 'each sentence', 'each paragraph']) {
  test(`${policy} uses the shared modern material by default`, async ({ page }) => {
    await page.goto('/')
    const playground = page.locator('#playground')
    await playground.scrollIntoViewIfNeeded()
    await playground.getByRole('radio', { name: policy, exact: true }).click()
    const surface = playground.locator('.settle').first()
    await expect(surface).toHaveAttribute('data-material', 'ambient-cell-skeleton-v7')
    await expect(surface).toHaveAttribute('data-ambient-condition', 'reshape')
    await expect(surface.locator('.ambient-composition')).toBeAttached()
    await expect(surface.locator('.settle-unit, .settle-candidate, .settle-draft, .settle-field, .settle-mark')).toHaveCount(0)
  })
}
