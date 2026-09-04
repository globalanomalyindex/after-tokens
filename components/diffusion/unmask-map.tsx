import type { TraceCompact } from '@/lib/diffusion/traces'

// The research figure for a recorded trajectory: one small rect per generated
// position at the step it committed, so the order the sampler actually used
// is drawn directly instead of described. Static and reduced-motion safe by
// construction, since nothing here animates.
type Props = {
  trace: TraceCompact
  compact?: boolean
  label?: string
}

function num(v: number | boolean | null | undefined, fallback: number): number {
  return typeof v === 'number' ? v : fallback
}

function signed(v: number): string {
  return `${v >= 0 ? '+' : ''}${v.toFixed(2)}`
}

export function UnmaskMap({ trace, compact = false, label }: Props) {
  const cols = trace.sampler.max_new_tokens
  const rows = trace.sampler.steps
  const blockSize = trace.sampler.block_size
  const hasBlocks = blockSize > 0 && blockSize < cols

  // viewBox units chosen so a 9px mono label reads at roughly its intended
  // size once the SVG is laid out at typical figure widths, per the
  // width-100%, aspect-~1.15:1 spec. Compact drops the margins entirely.
  const W = compact ? 260 : 600
  const marginLeft = compact ? 0 : 40
  const marginBottom = compact ? 0 : 30
  const flipsAvailable =
    !compact && trace.tokens.length > 0 && trace.tokens.every((t) => typeof t.flips === 'number')
  const flipsGap = 8
  const flipsH = flipsAvailable ? 56 : 0
  const H = compact ? W : Math.round(W / 1.15) + marginBottom + (flipsAvailable ? flipsH + flipsGap + 12 : 0)

  const gridX0 = marginLeft
  const gridY0 = 0
  const gridW = W - marginLeft
  const gridH = H - marginBottom - (flipsAvailable ? flipsH + flipsGap + 12 : 0)
  const cellW = cols > 0 ? gridW / cols : 0
  const cellH = rows > 0 ? gridH / rows : 0

  const maxFlips = flipsAvailable ? Math.max(1, ...trace.tokens.map((t) => t.flips)) : 1

  const contentTokens = num(trace.stats.content_tokens, trace.tokens.filter((t) => !t.tail).length)
  const tau = num(trace.stats.kendall_tau_step_vs_position, 0)
  const ariaLabel = `Unmask map for ${trace.prompt_id}, ${trace.sampler.id}: ${contentTokens} content tokens committed over ${rows} steps, rank correlation with reading order ${signed(tau)}`

  const ruleStroke = 'color-mix(in oklab, var(--ink) 18%, transparent)'
  const blockBoundaries: number[] = []
  if (hasBlocks) {
    for (let k = blockSize; k < cols; k += blockSize) blockBoundaries.push(k)
  }

  return (
    <figure className="m-0">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        style={{ display: 'block', aspectRatio: `${W} / ${H}` }}
        role="img"
        aria-label={ariaLabel}
      >
        {/* content and tail commits */}
        {trace.tokens.map((t) => {
          if (t.step < 0) return null
          const x = gridX0 + t.pos * cellW
          const y = gridY0 + t.step * cellH
          const w = Math.max(0.4, cellW * 0.86)
          const h = Math.max(0.4, cellH * 0.86)
          if (t.tail) {
            return <rect key={t.pos} x={x} y={y} width={w} height={h} fill="var(--muted)" opacity={0.28} />
          }
          const opacity = 0.35 + 0.65 * Math.max(0, Math.min(1, t.conf))
          return (
            <rect key={t.pos} x={x} y={y} width={w} height={h} fill="var(--section-accent)" opacity={opacity} />
          )
        })}

        {/* block-schedule rules */}
        {blockBoundaries.map((k) => (
          <line
            key={k}
            x1={gridX0 + k * cellW}
            y1={gridY0}
            x2={gridX0 + k * cellW}
            y2={gridY0 + gridH}
            stroke={ruleStroke}
            strokeWidth={compact ? 0.5 : 1}
            vectorEffect="non-scaling-stroke"
          />
        ))}

        {/* flips strip: how many times the provisional guess changed per position */}
        {flipsAvailable && (
          <g>
            <text
              x={gridX0}
              y={gridY0 + gridH + flipsGap - 2}
              fontFamily="var(--font-mono)"
              fontSize={9}
              fill="var(--muted)"
            >
              provisional guess changes
            </text>
            {trace.tokens.map((t) => {
              if (t.step < 0) return null
              const x = gridX0 + t.pos * cellW
              const barW = Math.max(0.4, cellW * 0.86)
              const stripY0 = gridY0 + gridH + flipsGap + 10
              const barH = Math.max(0.5, (t.flips / maxFlips) * flipsH)
              return (
                <rect
                  key={t.pos}
                  x={x}
                  y={stripY0 + (flipsH - barH)}
                  width={barW}
                  height={barH}
                  fill="var(--muted)"
                  opacity={0.55}
                />
              )
            })}
          </g>
        )}

        {/* micro axis labels */}
        {!compact && (
          <>
            <text
              x={gridX0}
              y={H - 4}
              fontFamily="var(--font-mono)"
              fontSize={9}
              fill="var(--muted)"
            >
              position →
            </text>
            <text
              x={12}
              y={gridY0 + gridH / 2}
              fontFamily="var(--font-mono)"
              fontSize={9}
              fill="var(--muted)"
              textAnchor="middle"
              transform={`rotate(-90 12 ${gridY0 + gridH / 2})`}
            >
              step ↓
            </text>
          </>
        )}
      </svg>
      {label && (
        <figcaption
          className="mt-2 text-[10px] uppercase tracking-[0.14em]"
          style={{ fontFamily: 'var(--font-mono)', color: 'var(--muted)' }}
        >
          {label}
        </figcaption>
      )}
    </figure>
  )
}
