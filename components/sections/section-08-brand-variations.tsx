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
      n={5}
      act="III"
      title="Brand variations"
      eyebrow={['One grammar', 'Four identities']}
    >
      <h2 className="text-4xl md:text-5xl font-bold tracking-tighter lowercase leading-tight mb-6 max-w-3xl">
        <span className="title-index">v.</span>The reveal grammar is brand-agnostic
      </h2>
      <p className="mb-6 text-base max-w-prose">
        <Highlight>
          One timeline, four identities. Same mode, same timing, same stagger, same tokenization.
          Only surface, ink, accent, type, and corner radius change. The reveal that tells you how
          settled an answer is does not belong to any one brand; it is a grammar each one can speak
          in its own voice. Four here, but the grammar does not care how many.
        </Highlight>
      </p>
      <p className="mb-6 text-base max-w-prose">
        <Highlight>
          Arrival is a brand moment, the way a splash screen or an app icon is. A portfolio of
          products sharing one system inherits a recognizable way of settling, without flattening
          what makes each voice its own.
        </Highlight>
      </p>
      <p className="mb-10 text-base max-w-prose">
        <Highlight>
          Replay them together and watch the identical timeline run under each skin: the same words
          lock in the same order at the same beat, only dressed differently.
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
