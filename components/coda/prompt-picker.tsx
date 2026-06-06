'use client'

import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from 'react'
import type { CodaPrompt } from '@/lib/coda/fixtures'

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReduced(mq.matches)
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])
  return reduced
}

const modeAbbrev: Record<CodaPrompt['defaultMode'], string> = {
  mycelium: 'Anlt',
  fog: 'Crtv',
  aurora: 'Smry',
  mitosis: 'Wild',
}

type Props = {
  prompts: CodaPrompt[]
  activeId: string
  onSelect: (id: string) => void
  layout?: 'grid' | 'list'
}

export function PromptPicker({ prompts, activeId, onSelect, layout = 'grid' }: Props) {
  const containerClass =
    layout === 'list'
      ? 'flex flex-col gap-2'
      : 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2'

  // Tactile commit, same mechanism as ToggleRail: snap to 0.97 for one frame on
  // activation, release over ~140ms. Fires on click and keyboard alike, and is
  // suppressed under prefers-reduced-motion.
  const [pressedId, setPressedId] = useState<string | null>(null)
  const releaseRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const btnRefs = useRef<(HTMLButtonElement | null)[]>([])
  const reduced = usePrefersReducedMotion()

  const commit = useCallback(
    (id: string) => {
      onSelect(id)
      if (reduced) return
      setPressedId(id)
      if (releaseRef.current) clearTimeout(releaseRef.current)
      requestAnimationFrame(() => {
        releaseRef.current = setTimeout(() => setPressedId(null), 160)
      })
    },
    [onSelect, reduced],
  )

  // Standard APG radiogroup keyboard handler. ARIA radios on <button> get no
  // native arrow-key behavior, so without this a keyboard user could Tab onto
  // the selected prompt but never reach the others (WCAG 2.1.1). Arrow keys
  // move with wrap, Home/End jump to the ends, and selection follows focus.
  const onKeyDown = useCallback(
    (e: KeyboardEvent, index: number) => {
      let next = index
      switch (e.key) {
        case 'ArrowRight':
        case 'ArrowDown':
          next = (index + 1) % prompts.length
          break
        case 'ArrowLeft':
        case 'ArrowUp':
          next = (index - 1 + prompts.length) % prompts.length
          break
        case 'Home':
          next = 0
          break
        case 'End':
          next = prompts.length - 1
          break
        default:
          return
      }
      const target = prompts[next]
      if (!target) return
      e.preventDefault()
      btnRefs.current[next]?.focus()
      commit(target.id)
    },
    [prompts, commit],
  )

  return (
    <div role="radiogroup" aria-label="Prompt" className={containerClass}>
      {prompts.map((p, index) => {
        const isActive = p.id === activeId
        const isPressed = p.id === pressedId
        return (
          <button
            key={p.id}
            ref={(el) => {
              btnRefs.current[index] = el
            }}
            type="button"
            role="radio"
            aria-checked={isActive}
            tabIndex={isActive ? 0 : -1}
            onClick={() => commit(p.id)}
            onKeyDown={(e) => onKeyDown(e, index)}
            className="toggle-pill rounded-xl px-4 py-3 text-left text-sm leading-snug cursor-pointer flex items-start gap-3 w-full"
            style={{
              border: '0.8px solid var(--ink)',
              background: isActive ? 'var(--ink)' : 'transparent',
              color: isActive ? 'var(--surface)' : 'var(--ink)',
              transform: isPressed ? 'scale(0.97)' : 'scale(1)',
              transition:
                'background-color 180ms var(--ease-out-strong), color 180ms var(--ease-out-strong), border-color 180ms var(--ease-out-strong), transform 140ms var(--ease-out-strong)',
            }}
          >
            <span
              aria-hidden="true"
              className="shrink-0 text-[8.5px] uppercase tracking-[0.14em] opacity-80 mt-[3px]"
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              {modeAbbrev[p.defaultMode]}
            </span>
            <span className="flex-1">{p.prompt}</span>
          </button>
        )
      })}
    </div>
  )
}
