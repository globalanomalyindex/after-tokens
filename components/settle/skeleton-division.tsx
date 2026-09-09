'use client'

import type { CSSProperties } from 'react'

const ROWS = [
  { width: 88, top: .55 },
  { width: 92, top: 1.92 },
  { width: 96, top: 3.31 },
  { width: 84, top: 4.69 },
  { width: 70, top: 6.05 },
] as const

/** An authored 950 ms introduction, independent of source text and progress.
 * Five contiguous slabs initially share one capsule-shaped clip. They divide
 * into the existing row envelopes, then yield to the word-like field beneath.
 * CSS owns phase; the parent removes this layer immediately at finality. */
export function SkeletonDivision({ lineHeightPx, barHeightPx }: { lineHeightPx?: number; barHeightPx?: number }) {
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
      {ROWS.map((row, index) => {
        const startTop = joinedTop + index * .56 * font
        const targetTop = index * line + (line - bar) / 2
        return <span key={index} className="skeleton-division__cell" data-division-cell={index} style={{
          ['--division-start-top' as string]: `${startTop}px`,
          ['--division-top' as string]: `${targetTop}px`,
          ['--division-width' as string]: `${row.width}%`,
          ['--division-peak-top' as string]: `${startTop + 1.018 * (targetTop - startTop)}px`,
          ['--division-peak-width' as string]: `${88 + 1.018 * (row.width - 88)}%`,
        } as CSSProperties} />
      })}
    </div>
  )
}
