'use client'

import { createContext, useContext, useMemo, type CSSProperties, type HTMLAttributes, type ReactNode } from 'react'
import { clampVoice, getBrand } from './brands'
import type { BrandId, BrandTokens, BrandVoice } from './types'

const BrandContext = createContext<BrandTokens>(getBrand('after-tokens'))

export function useBrand(): BrandTokens {
  return useContext(BrandContext)
}

/** The CSS variables a voice sets on its wrapper; the reveal's stylesheet reads them. */
export function voiceStyle(voice: BrandVoice): CSSProperties {
  const v = clampVoice(voice)
  return {
    ['--voice-attack' as string]: `${Math.round(v.attack)}ms`,
    ['--voice-weight' as string]: v.weight.toFixed(2),
    ['--voice-glow' as string]: v.glow.toFixed(2),
    ['--voice-hush' as string]: v.hush.toFixed(2),
  } as CSSProperties
}

type BrandProviderProps = Omit<HTMLAttributes<HTMLElement>, 'children'> & {
  brand?: BrandId
  /** a voice override on top of the brand's own, clamped to the ranges */
  voice?: Partial<BrandVoice>
  children: ReactNode
  as?: keyof React.JSX.IntrinsicElements
}

export function BrandProvider({
  brand = 'after-tokens',
  voice: voiceProp,
  children,
  as = 'div',
  className,
  style: styleProp,
  ...rest
}: BrandProviderProps) {
  const tokens = useMemo<BrandTokens>(() => {
    const base = getBrand(brand)
    return voiceProp ? { ...base, voice: clampVoice({ ...base.voice, ...voiceProp }) } : base
  }, [brand, voiceProp])
  const tokenStyle = useMemo<CSSProperties>(
    () => ({
      ['--surface' as string]: tokens.surface,
      ['--surface-tint' as string]: tokens.surfaceTint,
      ['--ink' as string]: tokens.ink,
      ['--ink-2' as string]: tokens.inkSecondary,
      ['--muted' as string]: tokens.muted,
      ['--stage' as string]: tokens.stage,
      ['--stage-text' as string]: tokens.stageText,
      ['--accent' as string]: tokens.accent,
      ['--particle' as string]: tokens.particleColor,
      ['--font-brand-display' as string]: tokens.fontDisplay,
      ['--font-brand-body' as string]: tokens.fontBody,
      ['--font-brand-mono' as string]: tokens.fontMono,
      ['--brand-radius' as string]: `${tokens.cornerRadius}px`,
      ...voiceStyle(tokens.voice),
    }),
    [tokens],
  )

  const Tag = as as 'div'
  return (
    <BrandContext.Provider value={tokens}>
      <Tag
        className={className}
        style={{ ...tokenStyle, ...styleProp }}
        data-brand={tokens.id}
        {...rest}
      >
        {children}
      </Tag>
    </BrandContext.Provider>
  )
}
