import { useImperativeHandle, useRef, type Ref } from 'react'
import type { TraceCompact } from '@/lib/diffusion/traces'

// The research figure for a recorded trajectory: one small rect per generated
// position at the step it committed, so the order the sampler actually used
// is drawn directly instead of described. Static by default. With `live`, a
// veil covers the rows the replay has not reached and a playhead line marks
// the current step, so the map draws itself in time with the stage beside
// it: the staircase appears as the words lock. The veil moves by attribute
// writes through the handle, never a React render per step.
export type UnmaskMapHandle = { setStep: (step: number) => void }

type Props = {
  trace: TraceCompact
  compact?: boolean
  label?: string
  live?: boolean
  ref?: Ref<UnmaskMapHandle>
}

function num(v: number | boolean | null | undefined, fallback: number): number {
  return typeof v === 'number' ? v : fallback
}

function signed(v: number): string {
  return `${v >= 0 ? '+' : ''}${v.toFixed(2)}`
}

export function UnmaskMap({ trace, compact = false, label, live = false, ref }: Props) {
  const veilRef = useRef<SVGRectElement | null>(null)
  const headRef = useRef<SVGLineElement | null>(null)
  const cols = trace.sampler.max_new_tokens
  const rows = trace.sampler.steps
  const blockSize = trace.sampler.block_size
  const hasBlocks = blockSize > 0 && blockSize < cols

  // viewBox units chosen so a 9px mono label reads at roughly its intended
  // size once the SVG is laid out at typical figure widths, per the
  // width-100%, aspect-~1.15:1 spec. Compact drops the margins entirely.
  const W = compact ? 260 : 600
  const marginLeft = compact ? 0 : 44
  const marginTop = compact ? 0 : 16
  const marginBottom = compact ? 0 : 34
  const flipsAvailable =
    !compact && trace.tokens.length > 0 && trace.tokens.every((t) => typeof t.flips === 'number')
  const flipsGap = 8
  const flipsH = flipsAvailable ? 56 : 0
  const flipsBlock = flipsAvailable ? flipsH + flipsGap + 12 : 0
  const gridW = W - marginLeft
  const gridH = compact ? W : Math.round(gridW / 1.15)
  const H = marginTop + gridH + marginBottom + flipsBlock

  const gridX0 = marginLeft
  const gridY0 = marginTop
  const cellW = cols > 0 ? gridW / cols : 0
  const cellH = rows > 0 ? gridH / rows : 0

  const maxFlips = flipsAvailable ? Math.max(1, ...trace.tokens.map((t) => t.flips)) : 1

  useImperativeHandle(
    ref,
    () => ({
      setStep(step: number) {
        const s = Math.max(0, Math.min(rows, step))
        const y = gridY0 + s * cellH
        const veil = veilRef.current
        const head = headRef.current
        if (veil) {
          veil.setAttribute('y', String(y))
          veil.setAttribute('height', String(Math.max(0, gridY0 + gridH - y)))
        }
        if (head) {
          head.setAttribute('y1', String(y))
          head.setAttribute('y2', String(y))
          head.setAttribute('opacity', s >= rows ? '0' : '1')
        }
      },
    }),
    [rows, gridY0, gridH, cellH],
  )

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
        {/* the typewriter line: position i committing at step i. A staircase that
            hugs it is left to right; a cloud away from it is out of order. */}
        <line
          x1={gridX0}
          y1={gridY0}
          x2={gridX0 + gridW}
          y2={gridY0 + gridH}
          stroke={ruleStroke}
          strokeWidth={compact ? 0.6 : 1}
          strokeDasharray={compact ? '2 3' : '4 4'}
          vectorEffect="non-scaling-stroke"
        />

        {/* content and tail commits */}
        {trace.tokens.map((t) => {
          if (t.step < 0) return null
          const x = gridX0 + t.pos * cellW
          const y = gridY0 + t.step * cellH
          const w = Math.max(0.4, cellW * 0.86)
          const h = Math.max(0.4, cellH * 0.86)
          const rx = compact ? 0 : Math.min(w, h) * 0.22
          if (t.tail) {
            return <rect key={t.pos} x={x} y={y} width={w} height={h} rx={rx} fill="var(--muted)" opacity={0.28} />
          }
          const opacity = 0.35 + 0.65 * Math.max(0, Math.min(1, t.conf))
          return (
            <rect key={t.pos} x={x} y={y} width={w} height={h} rx={rx} fill="var(--section-accent)" opacity={opacity} />
          )
        })}

        {/* ticks: positions along the bottom, steps down the left, block labels on top */}
        {!compact && (
          <g fontFamily="var(--font-mono)" fontSize={8.5} fill="var(--muted)">
            {[0, 0.25, 0.5, 0.75, 1].map((f) => (
              <text key={`px${f}`} x={gridX0 + f * gridW} y={gridY0 + gridH + 11} textAnchor={f === 0 ? 'start' : f === 1 ? 'end' : 'middle'}>
                {Math.round(f * cols)}
              </text>
            ))}
            {[0, 0.25, 0.5, 0.75, 1].map((f) => (
              <text key={`st${f}`} x={gridX0 - 6} y={gridY0 + f * gridH + (f === 0 ? 7 : f === 1 ? 0 : 3)} textAnchor="end">
                {Math.round(f * rows)}
              </text>
            ))}
            {hasBlocks &&
              Array.from({ length: Math.ceil(cols / blockSize) }, (_, b) => (
                <text
                  key={`b${b}`}
                  x={gridX0 + (b + 0.5) * blockSize * cellW}
                  y={gridY0 - 5}
                  textAnchor="middle"
                  letterSpacing="0.08em"
                >
                  block {b + 1}
                </text>
              ))}
            <text
              x={gridX0 + gridW * 0.3}
              y={gridY0 + gridH * 0.3 - 9}
              fill="var(--muted)"
              opacity={0.85}
              transform={`rotate(${(Math.atan2(gridH, gridW) * 180) / Math.PI} ${gridX0 + gridW * 0.3} ${gridY0 + gridH * 0.3 - 9})`}
              letterSpacing="0.08em"
            >
              left to right, for reference
            </text>
          </g>
        )}

        {/* live veil and playhead: the rows the replay has not reached yet */}
        {live && (
          <g>
            <rect
              ref={veilRef}
              x={gridX0}
              y={gridY0}
              width={gridW}
              height={gridH}
              fill="var(--bone)"
              opacity={0.86}
            />
            <line
              ref={headRef}
              x1={gridX0}
              x2={gridX0 + gridW}
              y1={gridY0}
              y2={gridY0}
              stroke="var(--section-accent)"
              strokeWidth={compact ? 1 : 1.5}
              vectorEffect="non-scaling-stroke"
            />
          </g>
        )}

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
              y={gridY0 + gridH + marginBottom + flipsGap - 2}
              fontFamily="var(--font-mono)"
              fontSize={9}
              fill="var(--muted)"
              letterSpacing="0.1em"
            >
              provisional guess changes per position
            </text>
            {trace.tokens.map((t) => {
              if (t.step < 0) return null
              const x = gridX0 + t.pos * cellW
              const barW = Math.max(0.4, cellW * 0.86)
              const stripY0 = gridY0 + gridH + marginBottom + flipsGap + 10
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

        {/* axis titles */}
        {!compact && (
          <>
            <text
              x={gridX0 + gridW}
              y={gridY0 + gridH + 26}
              fontFamily="var(--font-mono)"
              fontSize={9}
              fill="var(--muted)"
              textAnchor="end"
              letterSpacing="0.1em"
            >
              position in the answer →
            </text>
            <text
              x={10}
              y={gridY0 + gridH / 2}
              fontFamily="var(--font-mono)"
              fontSize={9}
              fill="var(--muted)"
              textAnchor="middle"
              letterSpacing="0.1em"
              transform={`rotate(-90 10 ${gridY0 + gridH / 2})`}
            >
              denoising step, 0 at the top
            </text>
          </>
        )}
      </svg>
      {!compact && (
        <div
          className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-[10px] tracking-[0.1em] lowercase"
          style={{ fontFamily: 'var(--font-mono)', color: 'var(--muted)' }}
          aria-hidden="true"
        >
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block w-2.5 h-2.5 rounded-[2px]" style={{ background: 'var(--section-accent)' }} />
            content commit, darker where the model was surer
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block w-2.5 h-2.5 rounded-[2px]" style={{ background: 'var(--muted)', opacity: 0.35 }} />
            end-of-sequence tail
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block w-4 border-t border-dashed" style={{ borderColor: 'color-mix(in oklab, var(--ink) 40%, transparent)' }} />
            left to right, for reference
          </span>
        </div>
      )}
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
