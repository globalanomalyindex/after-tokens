'use client'

import { useCallback, useId, useRef, useState, type KeyboardEvent } from 'react'
import { usePrefersReducedMotion } from '@/lib/motion/use-prefers-reduced-motion'

type Item = { id: string; label: string; isAuto?: boolean; badge?: string }

type Props = {
  label: string
  items: Item[]
  activeId: string
  onSelect: (id: string) => void
}

export function ToggleRail({ label, items, activeId, onSelect }: Props) {
  const labelId = useId()
  // A transient "just-committed" id drives the tactile press: on activation the
  // pill snaps to scale(0.96) for one frame, then releases to 1 over ~140ms.
  // Self-contained so it fires on click AND on keyboard activation (Enter/Space),
  // where :active alone would miss. Suppressed under prefers-reduced-motion.
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
      // Release on the next frame so the 0.96 -> 1 transition actually plays.
      requestAnimationFrame(() => {
        releaseRef.current = setTimeout(() => setPressedId(null), 160)
      })
    },
    [onSelect, reduced],
  )

  // Standard APG radiogroup keyboard handler. ARIA radios on <button> do NOT
  // inherit native radio arrow-key semantics, so without this a keyboard user
  // can Tab onto the selected pill but never reach the others (WCAG 2.1.1).
  // Arrow keys move with wrap, Home/End jump to the ends, and selection follows
  // focus per the radio convention.
  const onKeyDown = useCallback(
    (e: KeyboardEvent, index: number) => {
      let next = index
      switch (e.key) {
        case 'ArrowRight':
        case 'ArrowDown':
          next = (index + 1) % items.length
          break
        case 'ArrowLeft':
        case 'ArrowUp':
          next = (index - 1 + items.length) % items.length
          break
        case 'Home':
          next = 0
          break
        case 'End':
          next = items.length - 1
          break
        default:
          return
      }
      const target = items[next]
      if (!target) return
      e.preventDefault()
      btnRefs.current[next]?.focus()
      commit(target.id)
    },
    [items, commit],
  )

  const hasLabel = label.trim().length > 0
  return (
    <div className={hasLabel ? 'grid grid-cols-[88px_1fr] gap-4 items-center' : 'grid'}>
      {hasLabel && (
        <span id={labelId} className="label">
          {label}
        </span>
      )}
      <div role="radiogroup" aria-labelledby={hasLabel ? labelId : undefined} aria-label={hasLabel ? undefined : 'options'} className="flex flex-wrap gap-1.5">
        {items.map((item, index) => {
          const isActive = item.id === activeId
          const isPressed = item.id === pressedId
          const badge = item.badge ?? (item.isAuto ? 'auto' : null)
          return (
            <button
              key={item.id}
              ref={(el) => {
                btnRefs.current[index] = el
              }}
              type="button"
              role="radio"
              aria-checked={isActive}
              // Roving tabIndex: only the active option is a tab stop. Arrow keys
              // (and Home/End) are handled explicitly by onKeyDown below, since
              // ARIA radios on buttons get no native arrow-key behavior.
              tabIndex={isActive ? 0 : -1}
              onClick={() => commit(item.id)}
              onKeyDown={(e) => onKeyDown(e, index)}
              className="toggle-pill px-3.5 py-1.5 text-[11px] rounded-md cursor-pointer inline-flex items-center gap-1.5"
              style={{
                border: '0.8px solid var(--ink)',
                background: isActive ? 'var(--ink)' : 'transparent',
                color: isActive ? 'var(--surface)' : 'var(--ink)',
                transform: isPressed ? 'scale(0.96)' : 'scale(1)',
                transition:
                  'background-color 180ms var(--ease-out-strong), color 180ms var(--ease-out-strong), border-color 180ms var(--ease-out-strong), transform 140ms var(--ease-out-strong), box-shadow 180ms var(--ease-out-strong)',
              }}
            >
              <span
                aria-hidden="true"
                className="w-1.5 h-1.5 rounded-full"
                style={{
                  background: isActive ? 'var(--accent)' : 'transparent',
                  border: isActive ? 'none' : '0.8px solid currentColor',
                  opacity: isActive ? 1 : 0.5,
                  transition:
                    'background-color 180ms var(--ease-out-strong), opacity 180ms var(--ease-out-strong)',
                }}
              />
              {item.label}
              {badge && (
                <span
                  className="ml-1 text-[8.5px] uppercase tracking-[0.14em]"
                  style={{
                    fontFamily: 'var(--font-mono)',
                    // Follow active state for contrast: near-white on the active
                    // dark pill, --muted (~5.1:1 AA) on an inactive bone pill,
                    // where the old near-white was effectively invisible.
                    color: isActive
                      ? 'color-mix(in oklab, var(--surface) 85%, var(--accent))'
                      : 'var(--muted)',
                  }}
                >
                  {badge}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
