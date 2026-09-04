'use client'

import { useEffect, useRef, useState } from 'react'
import { Section } from '@/components/section'
import { BrandProvider } from '@/lib/brand/provider'
import { DiffusionText } from '@/components/diffusion/diffusion-text'
import { Highlight } from '@/components/chrome/highlight'
import type { BrandId } from '@/lib/brand/types'

const variants: { id: BrandId; industry: string; prompt: string; response: string }[] = [
  {
    id: 'halcyon',
    industry: 'Institutional finance',
    prompt: 'Portfolio summary',
    response: 'Your Q3 allocation shifted three basis points toward fixed income.',
  },
  {
    id: 'felt',
    industry: 'Creative agency',
    prompt: 'Generate concepts',
    response: 'Three moodboards ready for your review. Bolder than last round.',
  },
  {
    id: 'pulse',
    industry: 'Wellness',
    prompt: 'Daily check-in',
    response: 'Rest looks a little light tonight. Maybe wind down earlier.',
  },
  {
    id: 'voltage',
    industry: 'Developer tool',
    prompt: '+ deploy status',
    response: 'Build passed. 3.2s. No regressions. Ready to merge.',
  },
]

const TILE_STAGGER_MS = 90

export function SectionBrandVariations() {
  const gridRef = useRef<HTMLDivElement>(null)
  const [inView, setInView] = useState(false)
  const [replayKey, setReplayKey] = useState(0)

  useEffect(() => {
    if (!gridRef.current) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setInView(true)
          observer.disconnect()
        }
      },
      { threshold: 0.15, rootMargin: '0px 0px -5% 0px' },
    )
    observer.observe(gridRef.current)
    return () => observer.disconnect()
  }, [])

  return (
    <Section
      id="brand-variations"
      n={8}
      act="III"
      title="Brand variations"
      eyebrow={['Generalization', 'Same motion, different tokens']}
    >
      <h2 className="text-4xl md:text-5xl font-bold tracking-tighter lowercase leading-tight mb-6 max-w-3xl">
        <span className="title-index">viii.</span>hold the motion constant; change the brand
      </h2>
      <p className="mb-6 text-base max-w-prose">
        <Highlight>
          One timeline, four identities. Mode, duration, lock order, and tokenization stay fixed.
          Only surface, ink, accent, type, and corner radius change. This isolates brand expression
          from state semantics instead of tuning both at once.
        </Highlight>
      </p>
      <p className="mb-6 text-base max-w-prose">
        <Highlight>
          Arrival can be a brand moment, but recognition cannot come at the cost of contrast or a
          truthful state signal. Every palette below uses AA-compliant text tokens.
        </Highlight>
      </p>
      <p className="mb-10 text-base max-w-prose">
        <Highlight>
          Replay all four to compare the identical timeline under four visual systems.
        </Highlight>
      </p>
      <div className="mb-6 flex items-center gap-4">
        <button
          type="button"
          onClick={() => setReplayKey((k) => k + 1)}
          className="replay-btn replay-btn-on-surface cursor-pointer inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.18em]"
          style={{ fontFamily: 'var(--font-mono)', color: 'var(--muted)' }}
          aria-label="Replay all four brand tiles together"
        >
          <span aria-hidden="true" className="replay-glyph">↻</span>
          Replay all
        </button>
      </div>
      <div ref={gridRef} className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-5 max-w-5xl">
        {variants.map((v, i) => (
          <BrandProvider
            key={v.id}
            brand={v.id}
            className="tile-enter rounded-2xl overflow-hidden border"
            style={{
              transitionDelay: `${i * TILE_STAGGER_MS}ms`,
            }}
            data-in-view={inView ? 'true' : 'false'}
          >
            <BrandTile
              key={replayKey}
              prompt={v.prompt}
              response={v.response}
              industry={v.industry}
              active={inView}
            />
          </BrandProvider>
        ))}
      </div>
    </Section>
  )
}

function BrandTile({
  prompt,
  response,
  industry,
  active,
}: {
  prompt: string
  response: string
  industry: string
  active: boolean
}) {
  return (
    <div
      className="p-5 md:p-6 min-h-[420px] flex flex-col justify-between relative"
      style={{
        background: 'var(--surface)',
        color: 'var(--ink)',
        borderColor: 'color-mix(in oklab, var(--ink) 12%, transparent)',
        borderRadius: 'var(--brand-radius)',
      }}
    >
      <div className="flex flex-col gap-2 mb-6">
        <span
          style={{
            fontFamily: 'var(--font-brand-mono)',
            fontSize: '9px',
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            color: 'var(--muted)',
          }}
        >
          + {prompt}
        </span>
        <span style={{ fontFamily: 'var(--font-brand-display)', fontWeight: 700, fontSize: '13px' }}>
          {industry}
        </span>
      </div>
      {active ? (
        <DiffusionText
          mode="mycelium"
          trigger="immediate"
          className="text-base md:text-lg leading-snug"
        >
          {response}
        </DiffusionText>
      ) : (
        <span aria-hidden="true" className="block text-base md:text-lg leading-snug opacity-0">
          {response}
        </span>
      )}
    </div>
  )
}
