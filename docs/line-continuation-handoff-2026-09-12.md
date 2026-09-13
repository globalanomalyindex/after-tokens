# A continuation on the current line

By Christopher Robin Fiore. GitHub: globalanomalyindex.

I added one broad rounded bar after the last readable character when a sentence- or word-based answer is still receiving text. This fills an otherwise empty line ending without introducing a row of tiny word placeholders.

The cue measures only text already released to the reading surface. It does not inspect future events, predict words, or guarantee that the eventual answer will continue on that line. Explicit newlines, narrow remaining space, completion, errors and stopped sources suppress it. It is a possibility cue while the source is still active.

The shared SettleAnswer component owns it, so presentation, article, gallery and product demos receive the same behavior. Baseline output is unchanged. Its absolute positioning cannot rewrap readable words. During a handover it clears before incoming text occupies that area; its geometry changes discretely rather than traveling across the answer. The continuation uses the exact AmbientComposition row material, measured bar height, breathing, glimmer and independently timed reshaping of the field below. A short remainder stays one broad bar; a longer remainder can divide into the same broad-cell arrangements. A 0.3em text gap joins it to the last meaningful character, while the existing field begins on the same vertical rhythm as the rows that follow: its lead is derived from half the difference between the line height and bar height. Trailing delimiter spaces are trimmed before measurement so they cannot create a phantom line below the readable text. The available remainder bounds the composition without consulting future content. Still mode, reduced motion, pause and offscreen states suppress or pause motion.

Validation checks the real bar geometry in Chrome, Safari and mobile emulation: it stays within the readable line's width and disappears at source completion. This is an implemented motion treatment, not evidence of a reading or perceived-speed benefit.

## Component

```tsx
'use client'

import { AmbientComposition, type AmbientCondition } from './ambient-composition'
import { useLayoutEffect, useState, type RefObject } from 'react'

type Props = {
  pageRef: RefObject<HTMLDivElement | null>
  frameRef: RefObject<HTMLDivElement | null>
  text: string
  visibleLength: number
  showing: boolean
  seed: string
  active: boolean
  motion: boolean
  condition: AmbientCondition
  tempo: number
  barHeight: number
}

/** A decorative continuation cue, measured only from already released text.
 * It reserves no layout space and makes no prediction about the next words. */
export function LineContinuation({ pageRef, frameRef, text, visibleLength, showing, seed, active, motion, condition, tempo, barHeight }: Props) {
  const [box, setBox] = useState<{ left: number; top: number; width: number; height: number } | null>(null)
  useLayoutEffect(() => {
    const page = pageRef.current, frame = frameRef.current
    if (!page || !frame) return
    const measure = () => {
      // A committed passage often carries one delimiter space for the next
      // passage. Measure the last meaningful glyph, never that collapsed
      // delimiter, or a range can resolve to a phantom line below the text.
      const visible = text.slice(0, visibleLength)
      const endsWithExplicitBreak = /[\r\n]\s*$/.test(visible)
      const meaningful = visible.replace(/\s+$/, '')
      if (!showing || !meaningful || endsWithExplicitBreak) { setBox(null); return }
      let remaining = meaningful.length
      const walker = document.createTreeWalker(page, NodeFilter.SHOW_TEXT)
      let node: Node | null
      while ((node = walker.nextNode())) {
        const length = node.textContent?.length ?? 0
        if (remaining > length) { remaining -= length; continue }
        if (!remaining) break
        const range = document.createRange()
        range.setStart(node, remaining - 1)
        range.setEnd(node, remaining)
        const last = range.getBoundingClientRect()
        const area = page.getBoundingClientRect(), origin = frame.getBoundingClientRect()
        const font = parseFloat(getComputedStyle(page).fontSize) || 16
        const gap = font * .3, available = area.right - last.right - gap
        if (!last.height || available < font * 2.5) { setBox(null); return }
        const height = barHeight
        setBox({ left: last.right - origin.left + gap, top: last.top - origin.top + (last.height - height) / 2, width: available, height })
        return
      }
      setBox(null)
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(page)
    document.fonts?.ready.then(measure)
    return () => observer.disconnect()
  }, [pageRef, frameRef, text, visibleLength, showing, seed, barHeight])
  return <span className="settle-line-continuation" aria-hidden="true" data-line-continuation data-shown={!!box} style={box ?? undefined}>
    {box && <AmbientComposition singleRow splitRow={box.width > barHeight * 11} active={active} motion={motion} condition={condition} complete={false} runId={seed} rowCount={1} lineHeightPx={barHeight} barHeightPx={barHeight} tempo={tempo} />}
  </span>
}
```

## Integration

SettleAnswer renders LineContinuation after its reading page, passing the page and frame refs, released answer text and the visually committed length. It enables the cue only during the receiving waiting phase for sentence and word policies. Keep the bar aria-hidden and out of normal layout.
