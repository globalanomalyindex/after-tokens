'use client'

import { createContext, useContext, useMemo, type CSSProperties, type HTMLAttributes, type ReactNode } from 'react'
import { getBrand } from './brands'
import type { BrandId, BrandTokens } from './types'

const BrandContext = createContext<BrandTokens>(getBrand('after-tokens'))

export function useBrand(): BrandTokens {
  return useContext(BrandContext)
}

type BrandProviderProps = Omit<HTMLAttributes<HTMLElement>, 'children'> & {
  brand?: BrandId
  children: ReactNode
  as?: keyof React.JSX.IntrinsicElements
}

export function BrandProvider({
  brand = 'after-tokens',
  children,
  as = 'div',
  className,
  style: styleProp,
  ...rest
}: BrandProviderProps) {
  const tokens = useMemo(() => getBrand(brand), [brand])
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
