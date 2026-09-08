import { Section } from '@/components/section'
import { Reveal } from '@/components/motion/reveal'
import { SettleStage } from '@/components/settle/settle-stage'
import { DefinitionTerm } from '@/components/chrome/definition-term'

// The field: the diffusion-native part of the surface. Two recordings, two
// shapes, and the legend for the cells.

const CELLS: { state: string; label: string; body: string }[] = [
  { state: 'open', label: 'open', body: 'no commitment yet' },
  { state: 'committed', label: 'committed', body: 'a token is in, but a hole before it keeps it off the prefix' },
  { state: 'end', label: 'end', body: 'the sampler marked this position as end; a run of them draws as a floor' },
  { state: 'held', label: 'held', body: 'on the prefix, but a piece of a word whose next piece is not in' },
  { state: 'forming', label: 'forming', body: 'on the prefix, word-complete, drawn dim, waiting for its passage to close' },
  { state: 'released', label: 'on the page', body: 'released under the policy' },
]

export function SectionField() {
  return (
    <Section id="field" title="What settles first">
      <h2 className="text-4xl md:text-6xl font-bold tracking-tighter leading-[1.02] mb-6 max-w-4xl">what settles first</h2>
      <p className="standfirst max-w-3xl">
        the field is the sampler&rsquo;s own field of positions, one cell each, drawn under the page. it shows where
        the model has committed, where a hole is holding the page, and, as end tokens settle, how long the answer is
        going to be. it never shows text, so it never lies about a word.
      </p>

      <div className="mt-12 md:mt-16 grid gap-8 lg:grid-cols-2 items-start">
        <Reveal>
          <h3 className="text-xl font-bold tracking-tight leading-tight mb-2">the block sampler: a clause at a time</h3>
          <p className="text-sm leading-relaxed max-w-[52ch] mb-5" style={{ color: 'var(--ink-2)' }}>
            inside each block of 32 the easy positions fill first and one hard position holds the rest. when it fills, a whole clause joins the
            prefix at once, and the page takes it as a sentence closes. the field shows the hole, then the burst.
          </p>
          <SettleStage source="trace:diffusion-explain__lowconf-b32" pace={{ scale: 4 }} compact />
        </Reveal>
        <Reveal delay={120}>
          <h3 className="text-xl font-bold tracking-tight leading-tight mb-2">the schedule-free sampler: the end, then the words</h3>
          <p className="text-sm leading-relaxed max-w-[52ch] mb-5" style={{ color: 'var(--ink-2)' }}>
            with no block schedule the model spends most of its steps deciding how short the answer is: the floor grows in from the right for a
            hundred steps, then the words land in the last few. the field shows the extent settling long before a single word can be read.
          </p>
          <SettleStage source="trace:sky-blue__lowconf-b128" pace={{ scale: 4 }} compact />
        </Reveal>
      </div>

      <div className="mt-12 md:mt-16 grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)] rule pt-8">
        <div>
          <h3 className="text-2xl md:text-3xl font-bold tracking-tight leading-tight">the cells</h3>
          <p className="mt-3 text-base leading-relaxed max-w-[44ch]" style={{ color: 'var(--ink-2)' }}>
            six states, all of them the reducer&rsquo;s. the line is always exactly as wide as the request, so a collapsed run of end cells takes
            its true share and reads as a bar growing in.
          </p>
        </div>
        <dl className="grid gap-4 sm:grid-cols-2 stage p-6 md:p-8" data-demo>
          {CELLS.map((c) => (
            <div key={c.state} className="grid grid-cols-[3rem_1fr] gap-4 items-start">
              <dt className="settle" style={{ ['--settle-open-alpha' as string]: 0.28 } as React.CSSProperties}>
                <span className="settle-field" data-mark="tick" data-still aria-hidden="true" style={{ ['--n' as string]: 6, marginTop: '0.35rem' } as React.CSSProperties}>
                  {c.state === 'end'
                    ? <span className="settle-floor" style={{ left: 0, width: '100%' }} />
                    : [0, 1, 2, 3, 4, 5].map((i) => <span key={i} className="settle-cell" data-state={c.state} />)}
                </span>
                <span className="settle-sr">{c.label}</span>
              </dt>
              <dd>
                <span className="readout block" style={{ color: 'var(--stage-text)' }}>{c.label}</span>
                <span className="text-sm leading-relaxed block mt-1" style={{ color: 'color-mix(in oklab, var(--stage-text) 72%, transparent)' }}>{c.body}</span>
              </dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="mt-12 md:mt-16 grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)]">
        <h3 className="text-2xl md:text-3xl font-bold tracking-tight leading-tight">the field replaces the three dots</h3>
        <div className="text-base leading-relaxed max-w-[60ch]" style={{ color: 'var(--ink-2)' }}>
          <p>
            a typing indicator says that something is happening. the field says what: 84 of 128 positions settled, the end known, one hole at
            position 8 holding the next sentence. it is the loading state this kind of model deserves, and it costs nothing in truth, because
            every cell is a fact the sampler already emitted.
          </p>
          <p className="mt-4">
            the <DefinitionTerm term="labor illusion">labor illusion</DefinitionTerm> is the reason to be careful here: seeing work raises the value
            people put on a result whether or not the result deserves it. so the field shows positions and never confidence, its cells are
            state and never a score, and the study measures whether a calmer surface gets believed too easily.
          </p>
          <p className="mt-4">
            the anchor in nature is sediment settling. in a column of stirred water the clear zone grows from the top down as the suspension
            drops out of it. the page is the clear zone; the field is the suspension; the rule is to wait for the water to clear before reading
            it, and to be able to see it clearing in the meantime.
          </p>
        </div>
      </div>
    </Section>
  )
}
