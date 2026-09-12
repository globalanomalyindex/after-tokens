'use client'

import { BrandProvider } from '@/lib/brand/provider'
import { useState } from 'react'
import { ToggleRail } from '@/components/coda/toggle-rail'
import { SNAPSHOT_STUDY } from '@/lib/settle/snapshot-study'
import { useReplay } from './use-replay'
import { SettleAnswer } from './settle-answer'

export function SnapshotStudy() {
  const clock = useReplay(SNAPSHOT_STUDY, { policy: 'sentence', autoplay: false })
  const [spectrum, setSpectrum] = useState(false)
  const [motion, setMotion] = useState(true)
  const [view, setView] = useState('protected')
  const draft = clock.state.status === 'complete' ? clock.state.prefix : clock.state.snapshotCandidate ?? ''
  return (
    <div className="mt-10 rule pt-8" data-snapshot-study data-elapsed-ms={clock.elapsedMs}>
      <div className="flex flex-wrap items-end justify-between gap-6 mb-6">
        <div className="max-w-2xl">
          <p className="readout mb-3" style={{ color: 'var(--muted)' }}>adapter exercise · authored input</p>
          <h3 className="text-2xl md:text-3xl font-bold tracking-tight">a draft can look finished.<br />and still change.</h3>
          <p className="mt-4 text-base leading-relaxed" style={{ color: 'var(--ink-2)' }}>Play the same revisable input through two views. The waiting field keeps its own rhythm as the draft changes. Even a complete-looking answer waits for the source&rsquo;s final signal; only then does the page fit and reveal the actual words.</p>
        </div>
        <div className="flex flex-wrap gap-5 readout"><button className="replay-btn replay-btn-on-surface" type="button" aria-pressed={spectrum} onClick={() => setSpectrum(value => !value)}>spectrum</button>
          <button className="replay-btn replay-btn-on-surface cursor-pointer" type="button" onClick={clock.finished ? clock.restart : clock.running ? clock.pause : clock.play}>
            {clock.finished ? 'replay example' : clock.running ? 'pause example' : clock.elapsedMs > 0 ? 'resume example' : 'play example'}
          </button>
          <button className="replay-btn replay-btn-on-surface cursor-pointer" type="button" aria-pressed={!motion} onClick={() => setMotion((value) => !value)}>motion {motion ? 'on' : 'off'}</button>
        </div>
      </div>
      <div className="md:hidden mb-5"><ToggleRail label="revision view" items={[{ id: 'protected', label: 'After Tokens' }, { id: 'draft', label: 'evolving draft' }]} activeId={view} onSelect={setView} /></div>
      <div className="grid gap-6 md:grid-cols-2 items-start">
        <figure className={`m-0 min-w-0 ${view === 'protected' ? 'block' : 'hidden md:block'}`}>
          <figcaption className="mb-3"><h4 className="font-semibold">After Tokens</h4><p className="mt-1 text-sm" style={{ color: 'var(--ink-2)' }}>The same input. One complete answer to read.</p></figcaption>
          <BrandProvider brand={spectrum ? 'spectrum' : 'after-tokens'} className="stage p-5">
            <SettleAnswer state={clock.state} runId={clock.runId} progress={clock.progress} motion={motion} paused={clock.paused} label="protected answer" className="text-[15px] leading-relaxed" />
          </BrandProvider>
        </figure>
        <figure className={`m-0 min-w-0 ${view === 'draft' ? 'block' : 'hidden md:block'}`}>
          <figcaption className="mb-3"><h4 className="font-semibold">Evolving draft</h4><p className="mt-1 text-sm" style={{ color: 'var(--ink-2)' }}>For inspection. This wording can still change.</p></figcaption>
          <div className="stage p-5">
            <div role="region" aria-label="evolving provisional draft" aria-busy={!clock.finished} className="whitespace-pre-wrap break-words text-[15px] leading-relaxed min-h-[8.125em]" data-snapshot-draft>{draft || <span className="readout" style={{ color: 'var(--stage-text)' }}>waiting for a draft</span>}</div>
            <div className="settle-margin readout"><span>{clock.finished ? 'source final' : 'provisional · may change'}</span></div>
          </div>
        </figure>
      </div>
      <p className="readout mt-5 max-w-4xl leading-relaxed" style={{ color: 'var(--muted)' }}>scripted 4.2-second sequence · revisions and final signal are authored. this tests an adapter contract; it is not a google recording, inferred frame timing or a connected gemini api. the current candidate can reserve rough total space; individual bars keep their authored widths. only an explicit final signal releases the words.</p>
    </div>
  )
}
