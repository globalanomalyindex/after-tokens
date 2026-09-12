'use client'

import { useRef, type CSSProperties } from 'react'

const FALLBACK_WIDTHS = [.88, .92, .96, .84, .70] as const

/** An authored 950 ms introduction, independent of source text and progress.
 * Five contiguous slabs initially share one capsule-shaped clip. They divide
 * into the existing row envelopes, then yield to the word-like field beneath.
 * CSS owns phase; an early release can fade the intact clipped layer. */
export function SkeletonDivision({ widths = FALLBACK_WIDTHS, lineHeightPx, barHeightPx }: { widths?: readonly number[]; lineHeightPx?: number; barHeightPx?: number }) {
  // Changing a CSS keyframe endpoint mid-flight can jump its interpolation.
  // Keep the opening's initial budgets; the persistent field underneath owns
  // smooth source-driven retargeting and crossfades in at the end of division.
  const initialWidths = useRef([...widths]).current
  const font = (barHeightPx ?? 13.5) / .9
  const line = lineHeightPx ?? font * 1.625
  const bar = barHeightPx ?? font * .9
  const joinedTop = (5 * line - 2.8 * font) / 2
  return (
    <div className="skeleton-division" data-skeleton-division aria-hidden="true" style={{
      ['--division-joined-inset' as string]: `${joinedTop}px`,
      ['--division-height' as string]: `${bar}px`,
      ['--division-peak-height' as string]: `${.56 * font + 1.018 * (bar - .56 * font)}px`,
    } as CSSProperties}>
      {FALLBACK_WIDTHS.map((fallback, index) => {
        const width = 100 * Math.max(0, Math.min(1, Number.isFinite(initialWidths[index]) ? initialWidths[index]! : fallback))
        const startTop = joinedTop + index * .56 * font
        const targetTop = index * line + (line - bar) / 2
        return <span key={index} className="skeleton-division__cell" data-division-cell={index} style={{
          ['--division-start-top' as string]: `${startTop}px`,
          ['--division-top' as string]: `${targetTop}px`,
          ['--division-width' as string]: `${width}%`,
          ['--division-peak-top' as string]: `${startTop + 1.018 * (targetTop - startTop)}px`,
          ['--division-peak-width' as string]: `${Math.max(0, Math.min(100, 88 + 1.018 * (width - 88)))}%`,
        } as CSSProperties} />
      })}
    </div>
  )
}
