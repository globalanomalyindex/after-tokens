'use client'

import { useCallback, useMemo, useState } from 'react'
import { ChatExchange } from '@/components/chat/chat-exchange'
import { DiffusionText } from '@/components/diffusion/diffusion-text'
import { ToggleRail } from '@/components/coda/toggle-rail'
import { ProfileReadout } from './profile-readout'
import { tokenize } from '@/lib/diffusion/tokenize'
import { wordSalience } from '@/lib/diffusion/salience'
import { CRYSTAL_TENSION_BUDGET } from '@/lib/diffusion/modes/crystal'
import type { WordState } from '@/lib/diffusion/types'

// The grammar, live, with its profile read off the words as they settle and
// the tension budget under the viewer's hand: one loop, two (the grammar's
// constant), three, or none (the earlier growth regime).

type BudgetId = '1' | '2' | '3' | 'unbounded'
const BUDGETS: { id: BudgetId; label: string }[] = [
  { id: '1', label: 'one loop' },
  { id: '2', label: 'two loops' },
  { id: '3', label: 'three loops' },
  { id: 'unbounded', label: 'no budget' },
]

type Props = { prompt: string; answer: string }

export function GrammarStage({ prompt, answer }: Props) {
  const [budgetId, setBudgetId] = useState<BudgetId>(String(CRYSTAL_TENSION_BUDGET) as BudgetId)
  const [replay, setReplay] = useState(0)
  const [states, setStates] = useState<Map<number, WordState>>(() => new Map())
  const budget = budgetId === 'unbounded' ? 'unbounded' : Number(budgetId)
  const atoms = useMemo(() => {
    const raw = tokenize(answer)
    const sal = wordSalience(raw, prompt)
    return raw.map((a, i) => ({ ...a, salience: sal[i] }))
  }, [answer, prompt])
  const onWordStates = useCallback((m: Map<number, WordState>) => setStates(m), [])

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_260px] items-start">
      <div className="stage p-5 md:p-7 min-h-[440px] flex flex-col justify-center">
        <ChatExchange prompt={prompt} runKey={`grammar-${budgetId}-${replay}`}>
          <DiffusionText
            mode="crystal"
            trigger="immediate"
            topic={prompt}
            budget={budget}
            showStatus
            announce="on-complete"
            onWordStates={onWordStates}
            className="text-base md:text-lg leading-relaxed"
          >
            {answer}
          </DiffusionText>
        </ChatExchange>
        <div className="flex justify-end mt-4">
          <button
            type="button"
            onClick={() => setReplay((k) => k + 1)}
            aria-label="Replay the answer"
            className="replay-btn cursor-pointer inline-flex items-center gap-1.5"
            style={{ color: 'color-mix(in oklab, var(--stage-text) 76%, transparent)' }}
          >
            <span aria-hidden="true" className="replay-glyph">↻</span>
            replay
          </button>
        </div>
      </div>
      <aside className="grid gap-6">
        <div>
          <div className="label mb-3">the profile, live</div>
          <ProfileReadout atoms={atoms} states={states} budget={budget} />
        </div>
        <div className="grid gap-2">
          <div className="label">tension budget</div>
          <ToggleRail label="" items={BUDGETS} activeId={budgetId} onSelect={(id) => setBudgetId(id as BudgetId)} />
          <p className="readout leading-relaxed" style={{ color: 'var(--muted)' }}>
            two is the grammar&rsquo;s constant. one reads as a typewriter with a wandering cursor; no budget is the
            earlier growth regime, five or more loops at once. the fifth claim in the evidence section is about this
            control.
          </p>
        </div>
      </aside>
    </div>
  )
}
