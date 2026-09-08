import type { CSSProperties } from 'react'
import { Section } from '@/components/section'
import { Reveal } from '@/components/motion/reveal'
import { SettleStage } from '@/components/settle/settle-stage'
import { DefinitionTerm } from '@/components/chrome/definition-term'

// The field: the diffusion-native part of the surface, carved into the text
// itself. Two recordings, two shapes, the registers a word passes through,
// and the strip as the field's compact form.

const REGISTERS: { label: string; body: string; sample: React.ReactNode }[] = [
  { label: 'open', body: 'a position with no commitment yet: a soft mark, in the voice&rsquo;s shape, standing where a word will', sample: <span className="settle-carve"><span className="settle-slot" data-state="open" /> <span className="settle-slot" data-state="open" /> <span className="settle-slot" data-state="open" /></span> },
  { label: 'held', body: 'a piece of a word is in; the rest is out, so no letters are drawn; the mark firms', sample: <span className="settle-carve"><span className="settle-slot" data-state="held" /> <span className="settle-slot" data-state="held" /></span> },
  { label: 'available', body: 'every piece and its boundaries are in. the word stands where it will, in the secondary ink, readable, waiting for its sentence', sample: <span className="settle-carve"><span className="settle-cw">sunlight scatters</span></span> },
  { label: 'settled', body: 'its sentence closed under the policy: the page&rsquo;s ink settled through the letterforms, and the word has not moved', sample: <span className="settle-passage"><span className="settle-w" data-t="The sky is blue.">The sky is blue.</span></span> },
  { label: 'end', body: 'the lowest committed end token; the answer ends at or before it, so nothing past it is drawn', sample: <span className="settle-carve"><span className="settle-slot" data-state="end" /></span> },
]

export function SectionField() {
  return (
    <Section id="field" title="What settles first">
      <h2 className="text-4xl md:text-6xl font-bold tracking-tighter leading-[1.02] mb-6 max-w-4xl">what settles first</h2>
      <p className="standfirst max-w-3xl">
        the field is carved into the text. every position after the page is drawn as what the sampler has made of it:
        a soft mark while it is open, a firmer mark when a piece of a word is in, the word itself in a secondary ink
        once every piece and its boundaries are in, and one end mark at the lowest position the sampler has marked as
        end, since an end token anywhere bounds the answer to before it. the zone is cut down from the tail as the model
        decides the length, words appear across it in the sampler&rsquo;s own order, and when a sentence closes the
        page&rsquo;s ink settles through its letterforms, bottom to top, in one movement. a word&rsquo;s shape never
        changes and it never moves; only its ink does. no letter is drawn that the source has not committed.
      </p>

      <div className="mt-12 md:mt-16 grid gap-8 lg:grid-cols-2 items-start">
        <Reveal>
          <h3 className="text-xl font-bold tracking-tight leading-tight mb-2">the block sampler: a clause at a time</h3>
          <p className="text-sm leading-relaxed max-w-[52ch] mb-5" style={{ color: 'var(--ink-2)' }}>
            inside each block of 32 the easy positions fill first and one hard position holds the rest. words appear across the block as
            they complete; when the hard position fills, a whole clause joins the prefix at once and the page takes it as a sentence closes.
          </p>
          <SettleStage source="trace:diffusion-explain__lowconf-b32" pace={{ scale: 4 }} compact />
        </Reveal>
        <Reveal delay={120}>
          <h3 className="text-xl font-bold tracking-tight leading-tight mb-2">the schedule-free sampler: the end, then the words</h3>
          <p className="text-sm leading-relaxed max-w-[52ch] mb-5" style={{ color: 'var(--ink-2)' }}>
            with no block schedule the model spends most of its steps deciding how short the answer is: the zone is carved down from the
            tail for a hundred steps, then the words land in the last few, then the sentence settles onto the page.
          </p>
          <SettleStage source="trace:sky-blue__lowconf-b128" pace={{ scale: 4 }} compact />
        </Reveal>
      </div>

      <div className="mt-12 md:mt-16 grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)] rule pt-8">
        <div>
          <h3 className="text-2xl md:text-3xl font-bold tracking-tight leading-tight">the registers</h3>
          <p className="mt-3 text-base leading-relaxed max-w-[44ch]" style={{ color: 'var(--ink-2)' }}>
            a word&rsquo;s progress is its ink. it is carried by the word, where the reader is looking, and by nothing else. the
            secondary ink is the page&rsquo;s ink moved toward the ground as far as a 4.5:1 contrast floor allows, because an available
            word is a word people will read; where a palette leaves no room to dim, the state is carried by a tint toward the brand&rsquo;s
            accent instead.
          </p>
        </div>
        <dl className="grid gap-5 stage p-6 md:p-8 settle" data-demo data-status="complete" data-mark="tick" style={{ ['--settle-open-alpha' as string]: 0.3, fontFamily: 'var(--font-ui)' } as CSSProperties}>
          {REGISTERS.map((r) => (
            <div key={r.label} className="grid grid-cols-[9rem_1fr] gap-4 items-baseline">
              <dt className="text-base" aria-label={r.label}>{r.sample}</dt>
              <dd>
                <span className="readout block" style={{ color: 'var(--stage-text)' }}>{r.label}</span>
                <span className="text-sm leading-relaxed block mt-1" style={{ color: 'color-mix(in oklab, var(--stage-text) 72%, transparent)' }}>{r.body}</span>
              </dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="mt-12 md:mt-16 grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)]">
        <h3 className="text-2xl md:text-3xl font-bold tracking-tight leading-tight">the carved zone replaces the three dots</h3>
        <div className="text-base leading-relaxed max-w-[60ch]" style={{ color: 'var(--ink-2)' }}>
          <p>
            a typing indicator says that something is happening. the carved zone says what, where the answer will be: 84 of 128 positions
            settled, the end known, one hole holding the next sentence, and the words that are already sure standing where they will.
            it costs nothing in truth, because every mark and every word is a fact the sampler already emitted. the margin keeps a
            small status for the stretch before any readable word exists.
          </p>
          <p className="mt-4">
            a product that wants the text zone quiet can hold the carved zone and show the strip instead: one cell per position under the
            page, the same states, the field&rsquo;s compact form. as marks become words the zone reflows, and everything that stays
            glides to its new place rather than jumping. the playground offers all three: the carved field, the in-order text
            alone, and nothing after the page, as margin did.
          </p>
          <p className="mt-4">
            the <DefinitionTerm term="labor illusion">labor illusion</DefinitionTerm> is the reason to be careful here: seeing work raises the value
            people put on a result whether or not the result deserves it. so a mark is never a letter, a word is never a score, and
            the study tests one hypothesis about this surface: that one calm transition inside newly ready words feels more coherent than
            many independent marks, without assuming a smoother presentation reads better.
          </p>
          <p className="mt-4">
            the anchor in nature is sediment settling. in a column of stirred water the clear zone grows from the top down as the suspension
            drops out of it. the page is the clear zone; the carved zone is the suspension; the rule is to wait for the water to clear before
            reading it, and to be able to see it clearing in the meantime.
          </p>
        </div>
      </div>
    </Section>
  )
}
