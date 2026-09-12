'use client'

import Image from 'next/image'
import { useId, useState } from 'react'
import { ToggleRail } from '@/components/coda/toggle-rail'

const FRAMES = [
  {
    id: '014',
    label: '14 · appearing',
    caption: 'The upper part of a solution is visible, with blue fragments and an unfinished lower area. The eventual seven-step layout is not yet all present.',
    alt: 'Gemini Diffusion reference frame 14: the answer panel contains a partial solution and blue changing fragments; the media label reads Real time output.',
  },
  {
    id: '035',
    label: '35 · revising',
    caption: 'Blue changes occupy several separated lines. The answer at the top says 39 while the last expression ends in 36. A readable-looking draft can still be inconsistent.',
    alt: 'Gemini Diffusion reference frame 35: a seven-step math draft has blue changes in several rows and inconsistent top and bottom results; the media label reads Slowed down output.',
  },
  {
    id: '045',
    label: '45 · settled image',
    caption: 'The final archived image shows a complete-looking solution without salient blue changes. A still image cannot establish an API completion event or an irreversible commitment.',
    alt: 'Gemini Diffusion reference frame 45: seven numbered steps and a final expression are visible in white, with the media label Slowed down output.',
  },
]

export function GoogleReference({ assetBase = '' }: { assetBase?: string }) {
  const [selected, setSelected] = useState('035')
  const titleId = useId()
  const frame = FRAMES.find(({ id }) => id === selected) ?? FRAMES[1]!
  const imagePath = `${assetBase}/study/google-reference/frame-${frame.id}.jpg`

  return (
    <div className="rule mt-12 md:mt-16 pt-8" aria-labelledby={titleId} data-google-reference>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)] mb-7">
        <h3 id={titleId} className="text-2xl md:text-3xl font-bold tracking-tight leading-tight">a draft can change<br />in many places</h3>
        <p className="text-base leading-relaxed max-w-[64ch]" style={{ color: 'var(--ink-2)' }}>
          Google describes Gemini Diffusion as refining blocks of text. I reviewed this frame archive to see how that appears on a page: several parts of a math solution change while its shape develops. That motivates keeping unstable words out of the reading surface while an independent ambient composition carries the wait. It does not establish that a real integration exposes drafts, final layout or token commitments.{' '}
          <a className="underline underline-offset-4" href="https://deepmind.google/models/gemini-diffusion/">Google&rsquo;s model overview</a>.
        </p>
      </div>
      <ToggleRail label="reference" items={FRAMES.map(({ id, label }) => ({ id, label }))} activeId={frame.id} onSelect={setSelected} />
      <figure className="m-0 mt-5">
        <a className="block" href={imagePath} target="_blank" rel="noreferrer" aria-label={`Open original reference frame ${Number(frame.id)} at full size`}>
          <Image src={imagePath} width={1920} height={1080} alt={frame.alt} unoptimized className="block w-full h-auto" />
        </a>
        <figcaption className="mt-4 text-sm leading-relaxed max-w-3xl" style={{ color: 'var(--ink-2)' }}>
          <span className="label">frame {Number(frame.id)} / 45</span><span className="ml-2">{frame.caption}</span>
        </figcaption>
      </figure>
      <p className="readout leading-relaxed mt-4 max-w-4xl" style={{ color: 'var(--muted)' }}>
        my frame archive · 45 JPEGs · original frames, selectable for inspection · the media switches between “Real time output” and “Slowed down output.” these are separate labeled sequences, without timestamps or an inferred frame rate.{' '}
        <a className="underline underline-offset-4" href="https://github.com/globalanomalyindex/after-tokens/blob/main/docs/google-diffusion-reference-audit-2026-09-09.md">frame audit and limits</a> ·{' '}
        <a className="underline underline-offset-4" href="https://blog.google/innovation-and-ai/models-and-research/google-deepmind/gemini-diffusion/">Google&rsquo;s launch note</a>
      </p>
    </div>
  )
}
