import type { CSSProperties } from 'react'
import type { PhraseAtom } from '@/lib/arrival/phrases'

// The lock map: one mark per word at the time it becomes legible, words left
// to right, time top to bottom. A typewriter draws a diagonal; a fade draws
// a floor; a scatter draws a cloud; the grammar draws a few short diagonals
// that start where the gist is and close one another. The same figure the
// research section draws for the recorded sampler, so an authored arrival
// and a measured one can be read the same way.

type Props = {
  atoms: PhraseAtom[]
  locks: number[]
  total: number
  label?: string
  /** draw the marks in the page accent: the grammar's own series */
  accent?: boolean
  /** word indices that opened their phrase, drawn as rings */
  nuclei?: Set<number>
  compact?: boolean
  className?: string
  style?: CSSProperties
}

export function LockMap({ atoms, locks, total, label, accent = false, nuclei, compact = false, className = '', style }: Props) {
  const n = atoms.length
  const W = 260
  const H = compact ? 150 : 180
  const padX = 6
  const padTop = label ? 16 : 6
  const padBottom = 6
  const gridW = W - padX * 2
  const gridH = H - padTop - padBottom
  const x = (i: number) => padX + (n <= 1 ? gridW / 2 : (i / (n - 1)) * gridW)
  const y = (t: number) => padTop + (total > 0 ? (Math.min(t, total) / total) * gridH : 0)
  const ink = accent ? 'var(--cobalt)' : 'var(--ink)'
  const firstLock = Math.min(...locks)
  const lastLock = Math.max(...locks)
  return (
    <svg
      className={`lock-map ${className}`}
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label={label ? `lock map, ${label}` : 'lock map'}
      style={style}
    >
      <rect x={padX} y={padTop} width={gridW} height={gridH} fill="none" stroke="color-mix(in oklab, var(--ink) 12%, transparent)" strokeWidth={0.75} />
      {/* the typewriter's diagonal, as a reference */}
      {n > 1 && Number.isFinite(firstLock) && (
        <line
          x1={x(0)}
          y1={y(firstLock)}
          x2={x(n - 1)}
          y2={y(lastLock)}
          stroke="color-mix(in oklab, var(--ink) 22%, transparent)"
          strokeWidth={0.75}
          strokeDasharray="2 3"
        />
      )}
      {atoms.map((a, i) => {
        const t = locks[i]
        if (t === undefined || !Number.isFinite(t)) return null
        const sal = a.salience ?? 0.3
        const isNucleus = nuclei?.has(a.index) ?? false
        return isNucleus ? (
          <circle key={i} cx={x(i)} cy={y(t)} r={3.2} fill="none" stroke={ink} strokeWidth={1.4} />
        ) : (
          <circle key={i} cx={x(i)} cy={y(t)} r={1.9} fill={ink} opacity={0.35 + 0.65 * sal} />
        )
      })}
      {label && (
        <text x={padX} y={10} fontSize={8.5} letterSpacing={0.8} fill="var(--muted)">
          {label}
        </text>
      )}
    </svg>
  )
}
