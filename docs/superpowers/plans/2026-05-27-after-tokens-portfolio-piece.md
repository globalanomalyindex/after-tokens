# After Tokens — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a portfolio-grade scrollytelling case study at a single Next.js URL that demonstrates four nature-derived diffusion text rendering animations, mapped to response types, and bendable across four variant brand identities.

**Architecture:** One long-scroll page built on a `<DiffusionText>` React primitive that consumes pluggable mode strategies. A motion-value-driven choreographer hook owns each animation timeline so per-frame updates do not re-render React. A `BrandProvider` context swaps design tokens for the brand-variation gallery and interactive coda. Most sections enter via `IntersectionObserver`; only the few pinned/scrubbed sections use GSAP ScrollTrigger. All animation runs on `transform`/`opacity` (plus `filter: blur` on non-text overlays). Reduced motion collapses every mode to a staggered fade.

**Tech Stack:** Next.js 15 (App Router, RSC), TypeScript strict, Tailwind v4 (`@tailwindcss/postcss`), Motion (`motion/react`), GSAP + ScrollTrigger, Vitest + React Testing Library for unit tests, Playwright for E2E and reduced-motion smoke tests, `next/font` self-hosting PP Neue Montreal + Berkeley Mono.

**Source of truth:** [docs/superpowers/specs/2026-05-27-diffusion-text-animation-design.md](../specs/2026-05-27-diffusion-text-animation-design.md).

**Operating notes:**
- The project is not under git; "Checkpoint" markers replace commits. If git is later initialized, checkpoints map 1:1 to commits.
- "Hard mode" directive is active: every phase ends with a slow-motion craft review; no animation ships without it.

---

## Phase 0 — Project setup

### Task 0.1: Initialize Next.js project

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `.gitignore`, `.editorconfig`, `app/layout.tsx`, `app/page.tsx`, `app/globals.css`

- [ ] **Step 1: Scaffold Next.js**

Run from project root:

```bash
npx create-next-app@latest . \
  --typescript --tailwind --app --no-src-dir \
  --import-alias "@/*" --use-pnpm --no-eslint --no-turbopack
```

When prompted "directory not empty," answer **yes** to overwrite. The spec and plan docs live in `docs/` and are not affected by the scaffolder.

- [ ] **Step 2: Verify project starts**

```bash
pnpm dev
```

Expected: server starts on `http://localhost:3000`. Open the URL, see the default Next.js placeholder. Stop the server with Ctrl+C.

- [ ] **Step 3: Strict TypeScript config**

Replace `tsconfig.json` with:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "ES2022"],
    "allowJs": false,
    "skipLibCheck": true,
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "noFallthroughCasesInSwitch": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules", "tests/e2e"]
}
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
pnpm tsc --noEmit
```

Expected: no errors.

- [ ] **Step 5: Checkpoint — project scaffolded**

Run `pnpm dev` once more to confirm the dev server still boots after the tsconfig change.

---

### Task 0.2: Install runtime dependencies

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install Motion, GSAP, font-related packages**

```bash
pnpm add motion gsap
pnpm add @phosphor-icons/react
```

- [ ] **Step 2: Verify versions**

```bash
pnpm list motion gsap @phosphor-icons/react
```

Expected: `motion@^11` or newer, `gsap@^3.12` or newer, `@phosphor-icons/react@^2.1` or newer.

- [ ] **Step 3: Checkpoint — runtime deps installed**

---

### Task 0.3: Install testing toolchain

**Files:**
- Modify: `package.json`
- Create: `vitest.config.ts`, `playwright.config.ts`, `tests/setup.ts`

- [ ] **Step 1: Install Vitest + RTL + Playwright**

```bash
pnpm add -D vitest @vitejs/plugin-react @vitest/ui @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom @playwright/test
```

- [ ] **Step 2: Create Vitest config**

`vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'node:path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    globals: true,
    include: ['**/*.{test,spec}.{ts,tsx}'],
    exclude: ['node_modules', 'tests/e2e/**', '.next'],
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, './') },
  },
})
```

- [ ] **Step 3: Create test setup**

`tests/setup.ts`:

```ts
import '@testing-library/jest-dom/vitest'

// jsdom does not implement matchMedia; mock with a default of "not reduced motion"
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  }),
})

// jsdom does not implement IntersectionObserver
class IO {
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() { return [] }
  root = null
  rootMargin = ''
  thresholds = []
}
;(globalThis as unknown as { IntersectionObserver: typeof IO }).IntersectionObserver = IO
```

- [ ] **Step 4: Create Playwright config**

`playwright.config.ts`:

```ts
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
    { name: 'mobile-portrait', use: { ...devices['iPhone 14'] } },
  ],
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
})
```

- [ ] **Step 5: Add test scripts to package.json**

Edit `package.json` `scripts`:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:e2e": "playwright test",
    "test:e2e:install": "playwright install",
    "typecheck": "tsc --noEmit"
  }
}
```

- [ ] **Step 6: Install Playwright browsers**

```bash
pnpm test:e2e:install
```

Expected: Chromium and WebKit binaries downloaded.

- [ ] **Step 7: Run an empty Vitest pass to verify config**

```bash
pnpm test
```

Expected: "No test files found" with a successful exit code.

- [ ] **Step 8: Checkpoint — testing toolchain ready**

---

### Task 0.4: Verify font licensing decision

**Files:**
- Create: `docs/fonts.md`

- [ ] **Step 1: Document fonts**

`docs/fonts.md`:

```markdown
# Fonts

Spec calls for **PP Neue Montreal** (display + body) and **Berkeley Mono** (mono labels).

## Status
- [ ] PP Neue Montreal license acquired and font files placed in `public/fonts/`
- [ ] Berkeley Mono license acquired and font files placed in `public/fonts/`

## Development fallback
If licenses are not yet acquired, use **Inter** (display + body) and **JetBrains Mono** (mono). The visual character is close enough for development. Swap to real fonts before production launch.

## File layout
```
public/fonts/
  PPNeueMontreal-Bold.woff2
  PPNeueMontreal-Medium.woff2
  PPNeueMontreal-Regular.woff2
  BerkeleyMono-Regular.woff2
  BerkeleyMono-Medium.woff2
```

All files must be subset to the glyphs used by the page (basic Latin + punctuation + `+` symbol).
```

- [ ] **Step 2: Decide which path you're on**

If you do not yet have the licensed fonts, proceed with Inter + JetBrains Mono for now (Task 1.2 loads them). Otherwise, place the woff2 files at the paths in the doc.

- [ ] **Step 3: Checkpoint — font path resolved**

---

## Phase 1 — Foundation (a blank page that already feels like the brand)

### Task 1.1: Establish design tokens as CSS custom properties

**Files:**
- Modify: `app/globals.css`
- Test: `tests/tokens.test.ts`

- [ ] **Step 1: Write failing test for token presence**

`tests/tokens.test.ts`:

```ts
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

describe('design tokens', () => {
  const css = readFileSync('app/globals.css', 'utf-8')

  it('defines the seven case-study tokens', () => {
    expect(css).toMatch(/--bone:\s*#EBE7DA/i)
    expect(css).toMatch(/--bone-2:\s*#E2DCCB/i)
    expect(css).toMatch(/--ink:\s*#15140F/i)
    expect(css).toMatch(/--ink-2:\s*#2A2820/i)
    expect(css).toMatch(/--muted:\s*#6C685C/i)
    expect(css).toMatch(/--stage:\s*#0B0A08/i)
    expect(css).toMatch(/--stage-text:\s*#EBE7DA/i)
  })

  it('defines the cobalt accent', () => {
    expect(css).toMatch(/--accent:\s*#1D3FD9/i)
  })

  it('forbids pure black and pure white in tokens', () => {
    const tokenBlock = css.match(/:root\s*\{[^}]+\}/)?.[0] ?? ''
    expect(tokenBlock).not.toMatch(/#000000|#FFFFFF|#000\b|#FFF\b/i)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm test tests/tokens.test.ts
```

Expected: FAIL — tokens not yet defined.

- [ ] **Step 3: Replace `app/globals.css`**

`app/globals.css`:

```css
@import "tailwindcss";

@theme {
  --color-bone: #EBE7DA;
  --color-bone-2: #E2DCCB;
  --color-ink: #15140F;
  --color-ink-2: #2A2820;
  --color-muted: #6C685C;
  --color-stage: #0B0A08;
  --color-stage-text: #EBE7DA;
  --color-accent: #1D3FD9;
}

:root {
  --bone: #EBE7DA;
  --bone-2: #E2DCCB;
  --ink: #15140F;
  --ink-2: #2A2820;
  --muted: #6C685C;
  --stage: #0B0A08;
  --stage-text: #EBE7DA;
  --accent: #1D3FD9;

  --ease-out-strong: cubic-bezier(0.23, 1, 0.32, 1);
  --ease-in-out-strong: cubic-bezier(0.77, 0, 0.175, 1);
  --ease-drawer: cubic-bezier(0.32, 0.72, 0, 1);
}

* { box-sizing: border-box; }
html, body { background: var(--bone); color: var(--ink); }
html { font-size: 16px; }
body { font-feature-settings: "ss01", "ss02", "cv01"; -webkit-font-smoothing: antialiased; }

::selection { background: var(--accent); color: var(--bone); }
```

- [ ] **Step 4: Run test to verify it passes**

```bash
pnpm test tests/tokens.test.ts
```

Expected: PASS, all three assertions green.

- [ ] **Step 5: Checkpoint — design tokens locked**

---

### Task 1.2: Load fonts via next/font

**Files:**
- Create: `lib/fonts.ts`
- Modify: `app/layout.tsx`, `app/globals.css`

Choose path based on Task 0.4:
- If you have PP Neue Montreal + Berkeley Mono licensed: use `next/font/local`.
- Otherwise: use `next/font/google` with Inter + JetBrains Mono as the dev fallback.

This task uses the **licensed** path. If using fallback, substitute the equivalent `next/font/google` calls and skip Step 3.

- [ ] **Step 1: Write failing test for font CSS variable presence**

`tests/fonts.test.tsx`:

```tsx
import { describe, expect, it } from 'vitest'
import { displayFont, monoFont } from '@/lib/fonts'

describe('fonts', () => {
  it('exposes a display CSS variable', () => {
    expect(displayFont.variable).toMatch(/^--font-display$|^[-_a-z0-9]+$/i)
  })
  it('exposes a mono CSS variable', () => {
    expect(monoFont.variable).toMatch(/^--font-mono$|^[-_a-z0-9]+$/i)
  })
})
```

- [ ] **Step 2: Run test, verify fail**

```bash
pnpm test tests/fonts.test.tsx
```

Expected: FAIL — `lib/fonts` does not exist.

- [ ] **Step 3: Implement font loader (licensed path)**

`lib/fonts.ts`:

```ts
import localFont from 'next/font/local'

export const displayFont = localFont({
  src: [
    { path: '../public/fonts/PPNeueMontreal-Regular.woff2', weight: '400', style: 'normal' },
    { path: '../public/fonts/PPNeueMontreal-Medium.woff2', weight: '500', style: 'normal' },
    { path: '../public/fonts/PPNeueMontreal-Bold.woff2', weight: '700', style: 'normal' },
  ],
  variable: '--font-display',
  display: 'swap',
})

export const monoFont = localFont({
  src: [
    { path: '../public/fonts/BerkeleyMono-Regular.woff2', weight: '400', style: 'normal' },
    { path: '../public/fonts/BerkeleyMono-Medium.woff2', weight: '500', style: 'normal' },
  ],
  variable: '--font-mono',
  display: 'swap',
})
```

Fallback alternative (`next/font/google`):

```ts
import { Inter, JetBrains_Mono } from 'next/font/google'

export const displayFont = Inter({
  subsets: ['latin'],
  variable: '--font-display',
  weight: ['400', '500', '700'],
  display: 'swap',
})

export const monoFont = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  weight: ['400', '500'],
  display: 'swap',
})
```

- [ ] **Step 4: Wire fonts into root layout**

Replace `app/layout.tsx`:

```tsx
import type { Metadata } from 'next'
import { displayFont, monoFont } from '@/lib/fonts'
import './globals.css'

export const metadata: Metadata = {
  title: 'After tokens. Designing AI text diffusion animations.',
  description:
    'A case study on UI animation language for AI text diffusion generation. Four nature-derived modes mapped to response types, bendable across brand identities.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${displayFont.variable} ${monoFont.variable}`}>
      <body>{children}</body>
    </html>
  )
}
```

- [ ] **Step 5: Wire font variables into globals.css**

Edit the `:root` block in `app/globals.css` to add:

```css
:root {
  /* ... existing tokens above ... */
  --font-display: var(--font-display, 'Inter'), system-ui, sans-serif;
  --font-mono: var(--font-mono, 'JetBrains Mono'), ui-monospace, monospace;
}

body { font-family: var(--font-display); }
code, pre, .mono { font-family: var(--font-mono); }
```

- [ ] **Step 6: Run test, verify pass**

```bash
pnpm test tests/fonts.test.tsx
```

Expected: PASS.

- [ ] **Step 7: Visual sanity check**

```bash
pnpm dev
```

Open `http://localhost:3000`. The default Next.js placeholder should now render in the display font on the bone background. Stop server.

- [ ] **Step 8: Checkpoint — fonts loaded**

---

### Task 1.3: Brand token type + default brand

**Files:**
- Create: `lib/brand/types.ts`, `lib/brand/brands.ts`
- Test: `tests/brand.test.ts`

- [ ] **Step 1: Write failing test**

`tests/brand.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { brands, getBrand } from '@/lib/brand/brands'

describe('brand tokens', () => {
  it('exposes the five spec brands', () => {
    expect(Object.keys(brands)).toEqual(
      expect.arrayContaining(['after-tokens', 'halcyon', 'felt', 'pulse', 'voltage']),
    )
  })

  it('every brand defines required tokens', () => {
    for (const brand of Object.values(brands)) {
      expect(brand.surface).toBeTruthy()
      expect(brand.ink).toBeTruthy()
      expect(brand.accent).toBeTruthy()
      expect(brand.stage).toBeTruthy()
      expect(brand.fontDisplay).toBeTruthy()
    }
  })

  it('getBrand("after-tokens") returns the case study brand', () => {
    expect(getBrand('after-tokens').surface).toBe('#EBE7DA')
  })

  it('getBrand falls back to after-tokens on unknown id', () => {
    expect(getBrand('nonexistent' as never).name).toBe('After tokens')
  })
})
```

- [ ] **Step 2: Run test, verify fail**

```bash
pnpm test tests/brand.test.ts
```

Expected: FAIL — module does not exist.

- [ ] **Step 3: Define the brand type**

`lib/brand/types.ts`:

```ts
export type BrandId = 'after-tokens' | 'halcyon' | 'felt' | 'pulse' | 'voltage'

export type BrandTokens = {
  id: BrandId
  name: string
  surface: string
  surfaceTint: string
  ink: string
  inkSecondary: string
  muted: string
  stage: string
  stageText: string
  accent: string
  particleColor: string
  fontDisplay: string
  fontBody: string
  fontMono: string
  cornerRadius: number
  surfaceTexture: 'none' | 'grid' | 'noise'
}
```

- [ ] **Step 4: Define the five brands**

`lib/brand/brands.ts`:

```ts
import type { BrandId, BrandTokens } from './types'

export const brands: Record<BrandId, BrandTokens> = {
  'after-tokens': {
    id: 'after-tokens',
    name: 'After tokens',
    surface: '#EBE7DA',
    surfaceTint: '#E2DCCB',
    ink: '#15140F',
    inkSecondary: '#2A2820',
    muted: '#6C685C',
    stage: '#0B0A08',
    stageText: '#EBE7DA',
    accent: '#1D3FD9',
    particleColor: '#EBE7DA',
    fontDisplay: 'var(--font-display)',
    fontBody: 'var(--font-display)',
    fontMono: 'var(--font-mono)',
    cornerRadius: 8,
    surfaceTexture: 'noise',
  },
  halcyon: {
    id: 'halcyon',
    name: 'Halcyon',
    surface: '#1A1F28',
    surfaceTint: '#22293A',
    ink: '#D8D4C6',
    inkSecondary: '#A8A398',
    muted: '#7A7569',
    stage: '#0E1218',
    stageText: '#D8D4C6',
    accent: '#8AA093',
    particleColor: '#8AA093',
    fontDisplay: '"Tiempos Headline", Georgia, serif',
    fontBody: '"Tiempos Text", Georgia, serif',
    fontMono: 'var(--font-mono)',
    cornerRadius: 8,
    surfaceTexture: 'noise',
  },
  felt: {
    id: 'felt',
    name: 'Felt',
    surface: '#A8453A',
    surfaceTint: '#923A30',
    ink: '#F4ECDC',
    inkSecondary: '#E0D8C8',
    muted: '#D4C8B2',
    stage: '#0B0A08',
    stageText: '#F4ECDC',
    accent: '#F4ECDC',
    particleColor: '#F4ECDC',
    fontDisplay: 'var(--font-display)',
    fontBody: 'var(--font-display)',
    fontMono: 'var(--font-mono)',
    cornerRadius: 12,
    surfaceTexture: 'none',
  },
  pulse: {
    id: 'pulse',
    name: 'Pulse',
    surface: '#E9EEF2',
    surfaceTint: '#DDE4EA',
    ink: '#1F2A36',
    inkSecondary: '#3D4956',
    muted: '#6A7480',
    stage: '#0F141B',
    stageText: '#E9EEF2',
    accent: '#6FA9B4',
    particleColor: '#6FA9B4',
    fontDisplay: 'var(--font-display)',
    fontBody: 'var(--font-display)',
    fontMono: 'var(--font-mono)',
    cornerRadius: 10,
    surfaceTexture: 'noise',
  },
  voltage: {
    id: 'voltage',
    name: 'Voltage',
    surface: '#0A0D12',
    surfaceTint: '#12161D',
    ink: '#EBE7DA',
    inkSecondary: '#B8B3A4',
    muted: '#7A7669',
    stage: '#000000',
    stageText: '#EBE7DA',
    accent: '#FF5E1F',
    particleColor: '#FF5E1F',
    fontDisplay: 'var(--font-display)',
    fontBody: 'var(--font-mono)',
    fontMono: 'var(--font-mono)',
    cornerRadius: 4,
    surfaceTexture: 'grid',
  },
}

export function getBrand(id: BrandId): BrandTokens {
  return brands[id] ?? brands['after-tokens']
}
```

Note: Voltage's `stage` is `#000000` intentionally as a brand-defining choice; outside the global page where the no-pure-black rule applies, the brand can break it. Document this in code comments only if it confuses future readers; otherwise leave it.

- [ ] **Step 5: Run test, verify pass**

```bash
pnpm test tests/brand.test.ts
```

Expected: PASS.

- [ ] **Step 6: Checkpoint — brand types defined**

---

### Task 1.4: BrandProvider React context

**Files:**
- Create: `lib/brand/provider.tsx`
- Test: `tests/brand-provider.test.tsx`

- [ ] **Step 1: Write failing test**

`tests/brand-provider.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { BrandProvider, useBrand } from '@/lib/brand/provider'

function Consumer() {
  const brand = useBrand()
  return <div data-testid="name">{brand.name}</div>
}

describe('BrandProvider', () => {
  it('provides the after-tokens brand by default', () => {
    render(<Consumer />)
    expect(screen.getByTestId('name')).toHaveTextContent('After tokens')
  })

  it('switches brand via prop', () => {
    render(
      <BrandProvider brand="felt">
        <Consumer />
      </BrandProvider>,
    )
    expect(screen.getByTestId('name')).toHaveTextContent('Felt')
  })

  it('injects brand tokens as CSS variables on its wrapping div', () => {
    const { container } = render(
      <BrandProvider brand="halcyon">
        <Consumer />
      </BrandProvider>,
    )
    const wrapper = container.firstChild as HTMLElement
    expect(wrapper.style.getPropertyValue('--surface')).toBe('#1A1F28')
    expect(wrapper.style.getPropertyValue('--ink')).toBe('#D8D4C6')
    expect(wrapper.style.getPropertyValue('--accent')).toBe('#8AA093')
  })
})
```

- [ ] **Step 2: Run test, verify fail**

```bash
pnpm test tests/brand-provider.test.tsx
```

Expected: FAIL — provider does not exist.

- [ ] **Step 3: Implement BrandProvider**

`lib/brand/provider.tsx`:

```tsx
'use client'

import { createContext, useContext, useMemo, type CSSProperties, type ReactNode } from 'react'
import { getBrand } from './brands'
import type { BrandId, BrandTokens } from './types'

const BrandContext = createContext<BrandTokens>(getBrand('after-tokens'))

export function useBrand(): BrandTokens {
  return useContext(BrandContext)
}

type BrandProviderProps = {
  brand?: BrandId
  children: ReactNode
  as?: keyof React.JSX.IntrinsicElements
  className?: string
}

export function BrandProvider({ brand = 'after-tokens', children, as = 'div', className }: BrandProviderProps) {
  const tokens = useMemo(() => getBrand(brand), [brand])
  const style = useMemo<CSSProperties>(
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
      <Tag className={className} style={style} data-brand={tokens.id}>
        {children}
      </Tag>
    </BrandContext.Provider>
  )
}
```

- [ ] **Step 4: Run test, verify pass**

```bash
pnpm test tests/brand-provider.test.tsx
```

Expected: PASS, all three assertions green.

- [ ] **Step 5: Checkpoint — BrandProvider working**

---

### Task 1.5: Registration crosshair component

**Files:**
- Create: `components/chrome/registration.tsx`
- Test: `tests/registration.test.tsx`

- [ ] **Step 1: Write failing test**

`tests/registration.test.tsx`:

```tsx
import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Registration, RegistrationFrame } from '@/components/chrome/registration'

describe('Registration', () => {
  it('renders a single crosshair at the named corner', () => {
    const { container } = render(<Registration corner="tl" />)
    const reg = container.firstChild as HTMLElement
    expect(reg.dataset.corner).toBe('tl')
  })

  it('RegistrationFrame renders four crosshairs', () => {
    const { container } = render(<RegistrationFrame />)
    expect(container.querySelectorAll('[data-corner]')).toHaveLength(4)
  })
})
```

- [ ] **Step 2: Run test, verify fail**

```bash
pnpm test tests/registration.test.tsx
```

Expected: FAIL.

- [ ] **Step 3: Implement**

`components/chrome/registration.tsx`:

```tsx
type Corner = 'tl' | 'tr' | 'bl' | 'br'

const positions: Record<Corner, string> = {
  tl: 'top-3 left-3',
  tr: 'top-3 right-3',
  bl: 'bottom-3 left-3',
  br: 'bottom-3 right-3',
}

export function Registration({ corner, size = 14 }: { corner: Corner; size?: number }) {
  return (
    <span
      data-corner={corner}
      aria-hidden="true"
      className={`absolute ${positions[corner]} pointer-events-none`}
      style={{ width: size, height: size, opacity: 0.7 }}
    >
      <span
        className="absolute"
        style={{
          left: '50%',
          top: 0,
          width: 1,
          height: '100%',
          background: 'currentColor',
          transform: 'translateX(-50%)',
        }}
      />
      <span
        className="absolute"
        style={{
          top: '50%',
          left: 0,
          height: 1,
          width: '100%',
          background: 'currentColor',
          transform: 'translateY(-50%)',
        }}
      />
    </span>
  )
}

export function RegistrationFrame({ size = 14 }: { size?: number }) {
  return (
    <>
      <Registration corner="tl" size={size} />
      <Registration corner="tr" size={size} />
      <Registration corner="bl" size={size} />
      <Registration corner="br" size={size} />
    </>
  )
}
```

- [ ] **Step 4: Run test, verify pass**

```bash
pnpm test tests/registration.test.tsx
```

Expected: PASS.

- [ ] **Step 5: Checkpoint — registration component shipped**

---

### Task 1.6: Architectural section numeral component

**Files:**
- Create: `components/chrome/section-numeral.tsx`
- Test: `tests/section-numeral.test.tsx`

- [ ] **Step 1: Write failing test**

`tests/section-numeral.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { SectionNumeral } from '@/components/chrome/section-numeral'

describe('SectionNumeral', () => {
  it('renders the two-digit number', () => {
    render(<SectionNumeral n={3} />)
    expect(screen.getByText('03')).toBeInTheDocument()
  })
  it('renders aria-hidden so screen readers skip the decoration', () => {
    const { container } = render(<SectionNumeral n={10} />)
    expect(container.firstChild).toHaveAttribute('aria-hidden', 'true')
  })
})
```

- [ ] **Step 2: Run test, verify fail**

```bash
pnpm test tests/section-numeral.test.tsx
```

Expected: FAIL.

- [ ] **Step 3: Implement**

`components/chrome/section-numeral.tsx`:

```tsx
export function SectionNumeral({ n, size = 240 }: { n: number; size?: number }) {
  const display = String(n).padStart(2, '0')
  return (
    <span
      aria-hidden="true"
      className="absolute right-10 bottom-[-2.5rem] select-none pointer-events-none font-bold"
      style={{
        fontSize: size,
        lineHeight: 0.78,
        letterSpacing: '-0.06em',
        color: 'currentColor',
        opacity: 0.05,
      }}
    >
      {display}
    </span>
  )
}
```

- [ ] **Step 4: Run test, verify pass**

```bash
pnpm test tests/section-numeral.test.tsx
```

Expected: PASS.

- [ ] **Step 5: Checkpoint — section numeral shipped**

---

### Task 1.7: Mono label component (eyebrow + section tags)

**Files:**
- Create: `components/chrome/mono-label.tsx`
- Test: `tests/mono-label.test.tsx`

- [ ] **Step 1: Write failing test**

`tests/mono-label.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { MonoLabel } from '@/components/chrome/mono-label'

describe('MonoLabel', () => {
  it('renders the parts separated by + tokens', () => {
    render(<MonoLabel parts={['Case study', 'Murmuration set', '2026']} />)
    expect(screen.getByText('Case study')).toBeInTheDocument()
    expect(screen.getByText('Murmuration set')).toBeInTheDocument()
    expect(screen.getByText('2026')).toBeInTheDocument()
    expect(screen.getAllByText('+').length).toBe(2)
  })
})
```

- [ ] **Step 2: Run test, verify fail**

```bash
pnpm test tests/mono-label.test.tsx
```

Expected: FAIL.

- [ ] **Step 3: Implement**

`components/chrome/mono-label.tsx`:

```tsx
import { Fragment } from 'react'

type MonoLabelProps = {
  parts: string[]
  size?: 'sm' | 'md'
  className?: string
}

export function MonoLabel({ parts, size = 'md', className = '' }: MonoLabelProps) {
  const fontSize = size === 'sm' ? '9px' : '10.5px'
  return (
    <span
      className={`inline-flex items-center gap-2 uppercase ${className}`}
      style={{
        fontFamily: 'var(--font-brand-mono, var(--font-mono))',
        fontSize,
        letterSpacing: '0.16em',
        color: 'var(--muted)',
      }}
    >
      {parts.map((part, i) => (
        <Fragment key={`${part}-${i}`}>
          {i > 0 && <span aria-hidden="true" style={{ color: 'var(--ink)', opacity: 0.45 }}>+</span>}
          <span>{part}</span>
        </Fragment>
      ))}
    </span>
  )
}
```

- [ ] **Step 4: Run test, verify pass**

```bash
pnpm test tests/mono-label.test.tsx
```

Expected: PASS.

- [ ] **Step 5: Checkpoint — mono label shipped**

---

### Task 1.8: Section shell component

**Files:**
- Create: `components/section.tsx`
- Test: `tests/section.test.tsx`

- [ ] **Step 1: Write failing test**

`tests/section.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Section } from '@/components/section'

describe('Section', () => {
  it('renders its children inside a labeled landmark', () => {
    render(
      <Section id="hook" n={1} title="Hook" act="I" eyebrow={['Case study', '2026']}>
        <p>body</p>
      </Section>,
    )
    expect(screen.getByRole('region', { name: /hook/i })).toBeInTheDocument()
    expect(screen.getByText('body')).toBeInTheDocument()
    expect(screen.getByText('01')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test, verify fail**

```bash
pnpm test tests/section.test.tsx
```

Expected: FAIL.

- [ ] **Step 3: Implement**

`components/section.tsx`:

```tsx
import { MonoLabel } from './chrome/mono-label'
import { SectionNumeral } from './chrome/section-numeral'
import { RegistrationFrame } from './chrome/registration'

type SectionProps = {
  id: string
  n: number
  act: 'I' | 'II' | 'III' | 'IV' | 'V'
  title: string
  eyebrow?: string[]
  children: React.ReactNode
}

export function Section({ id, n, act, title, eyebrow, children }: SectionProps) {
  return (
    <section
      id={id}
      aria-label={title}
      data-section={id}
      data-act={act}
      className="relative min-h-[80vh] py-20 px-10 md:py-32 md:px-16"
    >
      <RegistrationFrame />
      <SectionNumeral n={n} />
      <div className="max-w-5xl mx-auto relative">
        {eyebrow && <MonoLabel parts={eyebrow} className="mb-3" />}
        {children}
      </div>
    </section>
  )
}
```

- [ ] **Step 4: Run test, verify pass**

```bash
pnpm test tests/section.test.tsx
```

Expected: PASS.

- [ ] **Step 5: Checkpoint — section shell shipped**

---

### Task 1.9: Root page renders the brand shell

**Files:**
- Modify: `app/page.tsx`

- [ ] **Step 1: Replace `app/page.tsx`**

```tsx
import { BrandProvider } from '@/lib/brand/provider'
import { Section } from '@/components/section'

export default function HomePage() {
  return (
    <BrandProvider brand="after-tokens" as="main" className="min-h-screen">
      <Section id="foundation-check" n={0} act="I" title="Foundation" eyebrow={['Phase 1', 'Foundation', '2026-05-27']}>
        <h1 className="text-6xl font-bold tracking-tighter leading-none mb-4">
          After tokens.
        </h1>
        <p className="text-base text-[color:var(--ink-2)] max-w-prose">
          Foundation is wired. Phase 2 brings the diffusion primitive online.
        </p>
      </Section>
    </BrandProvider>
  )
}
```

- [ ] **Step 2: Visual check**

```bash
pnpm dev
```

Open `http://localhost:3000`. Verify:
- Bone surface
- "After tokens." in a large display weight, dark ink
- Registration crosshairs visible at all four corners
- Faint "00" architectural numeral bottom-right
- The mono eyebrow with `+` separators above the headline

Stop server.

- [ ] **Step 3: Checkpoint — foundation visually online**

---

### Task 1.10: Phase 1 polish pass

**Goal:** A blank page that already feels like the brand. Audit before moving on.

- [ ] **Step 1: Run all tests**

```bash
pnpm test
```

Expected: all green.

- [ ] **Step 2: Run typecheck**

```bash
pnpm typecheck
```

Expected: no errors.

- [ ] **Step 3: Visual audit checklist**

Run `pnpm dev`. Open `http://localhost:3000`. Manually verify:
- [ ] No pure black or white visible anywhere
- [ ] Registration crosshairs are exactly 14px at corners, not pixel-misaligned
- [ ] Architectural numeral is faint but legible, not invisible or too dark
- [ ] Mono label uses Berkeley Mono (or JetBrains Mono fallback) at correct letter-spacing
- [ ] Display font renders the headline at the right weight
- [ ] No layout shifts during font swap (open devtools network panel, throttle to Slow 3G, hard reload, watch for shift)
- [ ] Page works in light AND dark browser themes (toggle macOS appearance; the page should not invert — it's permanently bone-themed by design)

Stop server.

- [ ] **Step 4: Checkpoint — Phase 1 complete**

---

## Phase 2 — DiffusionText primitive plus Murmuration mode

### Task 2.1: Word atom tokenizer

**Files:**
- Create: `lib/diffusion/tokenize.ts`
- Test: `tests/tokenize.test.ts`

- [ ] **Step 1: Write failing test**

`tests/tokenize.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { tokenize } from '@/lib/diffusion/tokenize'

describe('tokenize', () => {
  it('splits a single sentence into word atoms preserving punctuation', () => {
    const atoms = tokenize('Speed. Diffusion resolves a response in parallel.')
    expect(atoms).toHaveLength(8)
    expect(atoms[0]?.text).toBe('Speed.')
    expect(atoms[1]?.text).toBe('Diffusion')
    expect(atoms[7]?.text).toBe('parallel.')
  })

  it('assigns line index based on newlines in input', () => {
    const atoms = tokenize('Line one.\nLine two here.')
    const onLine1 = atoms.filter((a) => a.lineIndex === 1)
    expect(onLine1).toHaveLength(3)
  })

  it('assigns a monotonic index across all atoms', () => {
    const atoms = tokenize('a b c d')
    expect(atoms.map((a) => a.index)).toEqual([0, 1, 2, 3])
  })

  it('returns empty array for empty input', () => {
    expect(tokenize('')).toEqual([])
    expect(tokenize('   ')).toEqual([])
  })
})
```

- [ ] **Step 2: Run test, verify fail**

```bash
pnpm test tests/tokenize.test.ts
```

Expected: FAIL.

- [ ] **Step 3: Implement**

`lib/diffusion/tokenize.ts`:

```ts
export type WordAtom = {
  text: string
  index: number
  lineIndex: number
}

export function tokenize(input: string): WordAtom[] {
  if (!input.trim()) return []
  const lines = input.split('\n')
  const atoms: WordAtom[] = []
  let globalIndex = 0
  lines.forEach((line, lineIdx) => {
    const words = line.split(/\s+/).filter(Boolean)
    for (const word of words) {
      atoms.push({ text: word, index: globalIndex, lineIndex: lineIdx })
      globalIndex += 1
    }
  })
  return atoms
}
```

- [ ] **Step 4: Run test, verify pass**

```bash
pnpm test tests/tokenize.test.ts
```

Expected: PASS.

- [ ] **Step 5: Checkpoint — tokenizer working**

---

### Task 2.2: Mode strategy interface

**Files:**
- Create: `lib/diffusion/types.ts`

- [ ] **Step 1: Define the interface**

`lib/diffusion/types.ts`:

```ts
import type { ReactNode } from 'react'
import type { WordAtom } from './tokenize'

export type WordState = 'pending' | 'resolving' | 'resolved'

export type ResolutionEvent = {
  wordIndex: number
  state: WordState
  t: number
}

export type MeasuredAtom = WordAtom & {
  bbox: { x: number; y: number; w: number; h: number }
}

export type OverlayProps = {
  words: MeasuredAtom[]
  progress: number
  reduced: boolean
}

export type ModeStrategy = {
  name: 'murmuration' | 'mycelium' | 'fog' | 'aurora'
  totalDuration: (words: MeasuredAtom[]) => number
  computeTimeline: (words: MeasuredAtom[]) => ResolutionEvent[]
  renderOverlay: (props: OverlayProps) => ReactNode
  reducedMotionFallback: (words: MeasuredAtom[]) => ResolutionEvent[]
}
```

- [ ] **Step 2: Verify it compiles**

```bash
pnpm typecheck
```

Expected: no errors.

- [ ] **Step 3: Checkpoint — interface defined**

---

### Task 2.3: Standard reduced-motion fallback (shared helper)

**Files:**
- Create: `lib/diffusion/reduced-motion.ts`
- Test: `tests/reduced-motion.test.ts`

- [ ] **Step 1: Write failing test**

`tests/reduced-motion.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { standardReducedFallback } from '@/lib/diffusion/reduced-motion'

const word = (i: number) => ({
  text: `w${i}`,
  index: i,
  lineIndex: 0,
  bbox: { x: 0, y: 0, w: 10, h: 10 },
})

describe('standardReducedFallback', () => {
  it('produces a resolving then resolved event per word', () => {
    const events = standardReducedFallback([word(0), word(1), word(2)])
    expect(events.filter((e) => e.state === 'resolved')).toHaveLength(3)
  })
  it('staggers resolution times monotonically', () => {
    const events = standardReducedFallback([word(0), word(1), word(2)])
    const resolvedTimes = events.filter((e) => e.state === 'resolved').map((e) => e.t)
    expect(resolvedTimes[0]!).toBeLessThan(resolvedTimes[1]!)
    expect(resolvedTimes[1]!).toBeLessThan(resolvedTimes[2]!)
  })
  it('completes inside the reduced-motion budget (300ms)', () => {
    const events = standardReducedFallback(Array.from({ length: 20 }, (_, i) => word(i)))
    const last = events[events.length - 1]!.t
    expect(last).toBeLessThanOrEqual(300)
  })
})
```

- [ ] **Step 2: Run test, verify fail**

```bash
pnpm test tests/reduced-motion.test.ts
```

Expected: FAIL.

- [ ] **Step 3: Implement**

`lib/diffusion/reduced-motion.ts`:

```ts
import type { MeasuredAtom, ResolutionEvent } from './types'

const TOTAL_REDUCED_MS = 200
const FADE_MS = 80

export function standardReducedFallback(words: MeasuredAtom[]): ResolutionEvent[] {
  if (words.length === 0) return []
  const stagger = Math.max(8, Math.min(20, (TOTAL_REDUCED_MS - FADE_MS) / words.length))
  const events: ResolutionEvent[] = []
  words.forEach((w, i) => {
    const start = i * stagger
    events.push({ wordIndex: w.index, state: 'resolving', t: start })
    events.push({ wordIndex: w.index, state: 'resolved', t: start + FADE_MS })
  })
  return events
}
```

- [ ] **Step 4: Run test, verify pass**

```bash
pnpm test tests/reduced-motion.test.ts
```

Expected: PASS.

- [ ] **Step 5: Checkpoint — reduced-motion fallback shared**

---

### Task 2.4: Murmuration mode strategy (timeline only)

**Files:**
- Create: `lib/diffusion/modes/murmuration.ts`
- Test: `tests/modes/murmuration-timeline.test.ts`

- [ ] **Step 1: Write failing test**

`tests/modes/murmuration-timeline.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { murmuration } from '@/lib/diffusion/modes/murmuration'

const measure = (count: number) =>
  Array.from({ length: count }, (_, i) => ({
    text: `w${i}`,
    index: i,
    lineIndex: 0,
    bbox: { x: i * 30, y: 0, w: 28, h: 20 },
  }))

describe('murmuration timeline', () => {
  it('has total duration between 1200ms and 1700ms for 8-12 words', () => {
    const t = murmuration.totalDuration(measure(10))
    expect(t).toBeGreaterThanOrEqual(1200)
    expect(t).toBeLessThanOrEqual(1700)
  })

  it('emits resolving then resolved per word', () => {
    const events = murmuration.computeTimeline(measure(5))
    expect(events.filter((e) => e.state === 'resolving')).toHaveLength(5)
    expect(events.filter((e) => e.state === 'resolved')).toHaveLength(5)
  })

  it('resolution order is roughly center-out (median word resolves earlier than edges)', () => {
    const events = murmuration.computeTimeline(measure(9))
    const resolvedT = new Map<number, number>()
    for (const e of events) if (e.state === 'resolved') resolvedT.set(e.wordIndex, e.t)
    const middle = resolvedT.get(4)!
    const left = resolvedT.get(0)!
    const right = resolvedT.get(8)!
    expect(middle).toBeLessThan(left)
    expect(middle).toBeLessThan(right)
  })
})
```

- [ ] **Step 2: Run test, verify fail**

```bash
pnpm test tests/modes/murmuration-timeline.test.ts
```

Expected: FAIL.

- [ ] **Step 3: Implement (timeline only — overlay comes in 2.5)**

`lib/diffusion/modes/murmuration.ts`:

```ts
import type { ModeStrategy, MeasuredAtom, ResolutionEvent } from '../types'
import { standardReducedFallback } from '../reduced-motion'

const PER_WORD_RESOLVE_MS = 280
const STAGGER_MS = 40

function totalDuration(words: MeasuredAtom[]): number {
  if (words.length === 0) return 0
  const lastStart = (words.length - 1) * STAGGER_MS
  return lastStart + PER_WORD_RESOLVE_MS
}

function computeTimeline(words: MeasuredAtom[]): ResolutionEvent[] {
  if (words.length === 0) return []
  const center = (words.length - 1) / 2
  const ordered = [...words].sort(
    (a, b) => Math.abs(a.index - center) - Math.abs(b.index - center),
  )
  const events: ResolutionEvent[] = []
  ordered.forEach((w, orderIdx) => {
    const start = orderIdx * STAGGER_MS
    events.push({ wordIndex: w.index, state: 'resolving', t: start })
    events.push({ wordIndex: w.index, state: 'resolved', t: start + PER_WORD_RESOLVE_MS })
  })
  return events
}

export const murmuration: ModeStrategy = {
  name: 'murmuration',
  totalDuration,
  computeTimeline,
  renderOverlay: () => null,
  reducedMotionFallback: standardReducedFallback,
}
```

- [ ] **Step 4: Run test, verify pass**

```bash
pnpm test tests/modes/murmuration-timeline.test.ts
```

Expected: PASS.

- [ ] **Step 5: Checkpoint — Murmuration timeline working**

---

### Task 2.5: Murmuration particle overlay

**Files:**
- Create: `components/diffusion/murmuration-overlay.tsx`
- Modify: `lib/diffusion/modes/murmuration.ts`

- [ ] **Step 1: Implement overlay component**

`components/diffusion/murmuration-overlay.tsx`:

```tsx
'use client'

import type { OverlayProps } from '@/lib/diffusion/types'

const PARTICLES_PER_WORD = 12
const TOTAL_PARTICLE_CAP = 80

type Particle = {
  word: number
  x: number
  y: number
  jx: number
  jy: number
}

function generateParticles(words: OverlayProps['words']): Particle[] {
  const particles: Particle[] = []
  for (const w of words) {
    if (particles.length >= TOTAL_PARTICLE_CAP) break
    const remaining = TOTAL_PARTICLE_CAP - particles.length
    const count = Math.min(PARTICLES_PER_WORD, remaining)
    const seed = w.index * 9301 + 49297
    for (let i = 0; i < count; i++) {
      const a = (seed + i * 7919) % 360
      const r = ((seed + i * 1009) % 30) + 8
      particles.push({
        word: w.index,
        x: w.bbox.x + w.bbox.w / 2,
        y: w.bbox.y + w.bbox.h / 2,
        jx: Math.cos((a * Math.PI) / 180) * r,
        jy: Math.sin((a * Math.PI) / 180) * r - 24,
      })
    }
  }
  return particles
}

export function MurmurationOverlay({ words, reduced }: OverlayProps) {
  if (reduced) return null
  const particles = generateParticles(words)
  return (
    <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
      {particles.map((p, i) => (
        <span
          key={i}
          data-word={p.word}
          className="absolute rounded-full"
          style={{
            left: p.x + p.jx,
            top: p.y + p.jy,
            width: 2,
            height: 2,
            background: 'var(--particle, var(--stage-text))',
            boxShadow: '0 0 3px color-mix(in oklab, var(--particle, var(--stage-text)) 55%, transparent)',
            transform: 'translate(-50%, -50%)',
            transition: 'transform 280ms var(--ease-out-strong), opacity 280ms var(--ease-out-strong)',
          }}
        />
      ))}
    </div>
  )
}
```

- [ ] **Step 2: Wire overlay into the strategy**

Update `lib/diffusion/modes/murmuration.ts` — replace the last `export const` block:

```ts
import { MurmurationOverlay } from '@/components/diffusion/murmuration-overlay'

export const murmuration: ModeStrategy = {
  name: 'murmuration',
  totalDuration,
  computeTimeline,
  renderOverlay: (props) => MurmurationOverlay(props),
  reducedMotionFallback: standardReducedFallback,
}
```

- [ ] **Step 3: Run existing tests, verify still pass**

```bash
pnpm test
```

Expected: all green.

- [ ] **Step 4: Checkpoint — Murmuration overlay shipped**

---

### Task 2.6: The choreographer hook

**Files:**
- Create: `lib/diffusion/choreographer.ts`
- Test: `tests/choreographer.test.tsx`

- [ ] **Step 1: Write failing test**

`tests/choreographer.test.tsx`:

```tsx
import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { useDiffusionChoreography } from '@/lib/diffusion/choreographer'
import { murmuration } from '@/lib/diffusion/modes/murmuration'

const measure = (count: number) =>
  Array.from({ length: count }, (_, i) => ({
    text: `w${i}`,
    index: i,
    lineIndex: 0,
    bbox: { x: i * 30, y: 0, w: 28, h: 20 },
  }))

describe('useDiffusionChoreography', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('initial state: all words pending, progress 0', () => {
    const { result } = renderHook(() =>
      useDiffusionChoreography({ words: measure(3), strategy: murmuration, trigger: 'manual' }),
    )
    expect(result.current.progress).toBe(0)
    expect(result.current.wordStates.get(0)).toBe('pending')
  })

  it('play() advances states by the strategy timeline', () => {
    const { result } = renderHook(() =>
      useDiffusionChoreography({ words: measure(3), strategy: murmuration, trigger: 'manual' }),
    )
    act(() => {
      result.current.play()
    })
    act(() => {
      vi.advanceTimersByTime(50)
    })
    expect(result.current.wordStates.get(1)).not.toBe('pending')
  })

  it('isComplete flips true after totalDuration', () => {
    const { result } = renderHook(() =>
      useDiffusionChoreography({ words: measure(3), strategy: murmuration, trigger: 'manual' }),
    )
    act(() => {
      result.current.play()
    })
    act(() => {
      vi.advanceTimersByTime(murmuration.totalDuration(measure(3)) + 100)
    })
    expect(result.current.isComplete).toBe(true)
  })
})
```

- [ ] **Step 2: Run test, verify fail**

```bash
pnpm test tests/choreographer.test.tsx
```

Expected: FAIL.

- [ ] **Step 3: Implement**

`lib/diffusion/choreographer.ts`:

```ts
'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { MeasuredAtom, ModeStrategy, ResolutionEvent, WordState } from './types'

type Trigger = 'inView' | 'immediate' | 'manual'

type UseChoreography = {
  words: MeasuredAtom[]
  strategy: ModeStrategy
  trigger?: Trigger
  reduced?: boolean
  onResolved?: () => void
}

type ChoreographyAPI = {
  wordStates: Map<number, WordState>
  progress: number
  isComplete: boolean
  play: () => void
  replay: () => void
  pause: () => void
}

export function useDiffusionChoreography({
  words,
  strategy,
  trigger = 'inView',
  reduced = false,
  onResolved,
}: UseChoreography): ChoreographyAPI {
  const events = useMemo<ResolutionEvent[]>(() => {
    if (words.length === 0) return []
    return reduced ? strategy.reducedMotionFallback(words) : strategy.computeTimeline(words)
  }, [words, strategy, reduced])

  const totalDuration = useMemo(() => strategy.totalDuration(words), [words, strategy])

  const [wordStates, setWordStates] = useState<Map<number, WordState>>(() => {
    const m = new Map<number, WordState>()
    for (const w of words) m.set(w.index, 'pending')
    return m
  })
  const [progress, setProgress] = useState(0)
  const [isComplete, setIsComplete] = useState(false)

  const startedAtRef = useRef<number | null>(null)
  const rafRef = useRef<number | null>(null)
  const pausedAtRef = useRef<number | null>(null)
  const pauseOffsetRef = useRef<number>(0)

  const tick = useCallback(() => {
    if (startedAtRef.current == null) return
    const now = performance.now()
    const elapsed = now - startedAtRef.current - pauseOffsetRef.current

    setWordStates((prev) => {
      const next = new Map(prev)
      let changed = false
      for (const ev of events) {
        if (ev.t <= elapsed && next.get(ev.wordIndex) !== ev.state) {
          next.set(ev.wordIndex, ev.state)
          changed = true
        }
      }
      return changed ? next : prev
    })

    const p = totalDuration > 0 ? Math.min(1, elapsed / totalDuration) : 1
    setProgress(p)

    if (elapsed >= totalDuration) {
      setIsComplete(true)
      if (onResolved) onResolved()
      return
    }
    rafRef.current = requestAnimationFrame(tick)
  }, [events, totalDuration, onResolved])

  const play = useCallback(() => {
    if (startedAtRef.current != null && !isComplete) return
    startedAtRef.current = performance.now()
    pauseOffsetRef.current = 0
    setIsComplete(false)
    rafRef.current = requestAnimationFrame(tick)
  }, [tick, isComplete])

  const pause = useCallback(() => {
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
    if (startedAtRef.current != null && pausedAtRef.current == null) {
      pausedAtRef.current = performance.now()
    }
  }, [])

  const replay = useCallback(() => {
    if (rafRef.current != null) cancelAnimationFrame(rafRef.current)
    setWordStates(() => {
      const m = new Map<number, WordState>()
      for (const w of words) m.set(w.index, 'pending')
      return m
    })
    setProgress(0)
    setIsComplete(false)
    startedAtRef.current = null
    pausedAtRef.current = null
    pauseOffsetRef.current = 0
    queueMicrotask(play)
  }, [words, play])

  useEffect(() => {
    if (trigger === 'immediate') play()
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current)
    }
  }, [trigger, play])

  useEffect(() => {
    function onVisibility() {
      if (document.hidden) pause()
      else if (startedAtRef.current != null && !isComplete) {
        const offset = pausedAtRef.current ? performance.now() - pausedAtRef.current : 0
        pauseOffsetRef.current += offset
        pausedAtRef.current = null
        rafRef.current = requestAnimationFrame(tick)
      }
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [pause, tick, isComplete])

  return { wordStates, progress, isComplete, play, replay, pause }
}
```

- [ ] **Step 4: Run test, verify pass**

```bash
pnpm test tests/choreographer.test.tsx
```

Expected: PASS.

- [ ] **Step 5: Checkpoint — choreographer working**

---

### Task 2.7: DiffusionText component

**Files:**
- Create: `components/diffusion/diffusion-text.tsx`
- Test: `tests/diffusion-text.test.tsx`

- [ ] **Step 1: Write failing test**

`tests/diffusion-text.test.tsx`:

```tsx
import { render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { DiffusionText } from '@/components/diffusion/diffusion-text'

describe('DiffusionText', () => {
  it('renders all tokenized words with data-state', () => {
    render(<DiffusionText mode="murmuration" trigger="manual">Speed beats slowness.</DiffusionText>)
    expect(screen.getByText('Speed')).toBeInTheDocument()
    expect(screen.getByText('beats')).toBeInTheDocument()
    expect(screen.getByText('slowness.')).toBeInTheDocument()
  })

  it('exposes the full text to aria-live for screen readers', () => {
    render(<DiffusionText mode="murmuration" trigger="manual">Hello world.</DiffusionText>)
    const live = screen.getByRole('status')
    expect(live).toHaveTextContent('Hello world.')
  })
})
```

- [ ] **Step 2: Run test, verify fail**

```bash
pnpm test tests/diffusion-text.test.tsx
```

Expected: FAIL.

- [ ] **Step 3: Implement**

`components/diffusion/diffusion-text.tsx`:

```tsx
'use client'

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { tokenize } from '@/lib/diffusion/tokenize'
import { useDiffusionChoreography } from '@/lib/diffusion/choreographer'
import { murmuration } from '@/lib/diffusion/modes/murmuration'
import { mycelium } from '@/lib/diffusion/modes/mycelium'
import { fog } from '@/lib/diffusion/modes/fog'
import { aurora } from '@/lib/diffusion/modes/aurora'
import type { MeasuredAtom, ModeStrategy } from '@/lib/diffusion/types'

const strategies: Record<string, ModeStrategy> = { murmuration, mycelium, fog, aurora }

type DiffusionTextProps = {
  children: string
  mode: 'murmuration' | 'mycelium' | 'fog' | 'aurora'
  trigger?: 'inView' | 'immediate' | 'manual'
  onResolved?: () => void
  className?: string
}

export function DiffusionText({
  children,
  mode,
  trigger = 'inView',
  onResolved,
  className = '',
}: DiffusionTextProps) {
  const atoms = useMemo(() => tokenize(children), [children])
  const containerRef = useRef<HTMLDivElement>(null)
  const wordRefs = useRef<(HTMLSpanElement | null)[]>([])
  const [measured, setMeasured] = useState<MeasuredAtom[]>([])
  const [reduced, setReduced] = useState(false)
  const [active, setActive] = useState(trigger === 'immediate')

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReduced(mq.matches)
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  useLayoutEffect(() => {
    if (atoms.length === 0 || !containerRef.current) return
    const containerBox = containerRef.current.getBoundingClientRect()
    const next: MeasuredAtom[] = []
    atoms.forEach((atom, i) => {
      const el = wordRefs.current[i]
      if (!el) return
      const box = el.getBoundingClientRect()
      next.push({
        ...atom,
        bbox: {
          x: box.left - containerBox.left,
          y: box.top - containerBox.top,
          w: box.width,
          h: box.height,
        },
      })
    })
    setMeasured(next)
  }, [atoms])

  useEffect(() => {
    if (trigger !== 'inView' || !containerRef.current) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setActive(true)
          observer.disconnect()
        }
      },
      { threshold: 0.3 },
    )
    observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [trigger])

  const strategy = strategies[mode]!
  const { wordStates, progress, play } = useDiffusionChoreography({
    words: measured,
    strategy,
    trigger: 'manual',
    reduced,
    onResolved,
  })

  useEffect(() => {
    if (active && measured.length > 0) play()
  }, [active, measured.length, play])

  const Overlay = strategy.renderOverlay

  return (
    <div ref={containerRef} className={`relative ${className}`} data-mode={mode}>
      <div role="status" aria-live="polite" className="sr-only">
        {children}
      </div>
      <span aria-hidden="true" className="block">
        {atoms.map((atom, i) => {
          const state = wordStates.get(atom.index) ?? 'pending'
          return (
            <span
              key={`${atom.index}-${atom.text}`}
              ref={(el) => {
                wordRefs.current[i] = el
              }}
              data-state={state}
              data-word-index={atom.index}
              className="inline-block transition-[opacity,filter] duration-[280ms] ease-out"
              style={{
                opacity: state === 'pending' ? 0.1 : state === 'resolving' ? 0.45 : 1,
                filter: state === 'pending' ? 'blur(2px)' : state === 'resolving' ? 'blur(0.5px)' : 'blur(0)',
                marginRight: '0.28em',
              }}
            >
              {atom.text}
            </span>
          )
        })}
      </span>
      {measured.length > 0 && Overlay({ words: measured, progress, reduced })}
    </div>
  )
}
```

- [ ] **Step 4: Create stub strategy files for mycelium, fog, aurora so imports resolve**

`lib/diffusion/modes/mycelium.ts`:

```ts
import type { ModeStrategy } from '../types'
import { standardReducedFallback } from '../reduced-motion'
import { murmuration } from './murmuration'

export const mycelium: ModeStrategy = {
  name: 'mycelium',
  totalDuration: murmuration.totalDuration,
  computeTimeline: murmuration.computeTimeline,
  renderOverlay: () => null,
  reducedMotionFallback: standardReducedFallback,
}
```

Repeat for `lib/diffusion/modes/fog.ts` and `lib/diffusion/modes/aurora.ts`, swapping the `name`.

These are temporary placeholders; Phase 3 replaces them with real strategies.

- [ ] **Step 5: Run test, verify pass**

```bash
pnpm test tests/diffusion-text.test.tsx
```

Expected: PASS.

- [ ] **Step 6: Checkpoint — DiffusionText component shipped**

---

### Task 2.8: Wire Murmuration into the foundation page

**Files:**
- Modify: `app/page.tsx`

- [ ] **Step 1: Replace `app/page.tsx`**

```tsx
'use client'

import { BrandProvider } from '@/lib/brand/provider'
import { Section } from '@/components/section'
import { DiffusionText } from '@/components/diffusion/diffusion-text'

export default function HomePage() {
  return (
    <BrandProvider brand="after-tokens" as="main" className="min-h-screen">
      <Section
        id="murmuration-demo"
        n={5}
        act="III"
        title="Murmuration"
        eyebrow={['Phase 2', 'Murmuration prototype', '2026']}
      >
        <h1 className="text-6xl font-bold tracking-tighter leading-none mb-8">After tokens.</h1>
        <div
          className="rounded-lg p-10"
          style={{ background: 'var(--stage)', color: 'var(--stage-text)' }}
        >
          <DiffusionText mode="murmuration" trigger="immediate" className="text-2xl leading-snug">
            Speed. Diffusion resolves a full response in a single pass, parallel across all tokens.
          </DiffusionText>
        </div>
      </Section>
    </BrandProvider>
  )
}
```

- [ ] **Step 2: Visual check**

```bash
pnpm dev
```

Open `http://localhost:3000`. Verify:
- The headline renders solid on the bone background
- The dark stage below it shows the diffusion sentence with each word resolving from a particle cluster
- Particles are visible as small light dots that converge as words resolve
- Resolution order is roughly center-out

Open devtools, toggle `prefers-reduced-motion: reduce` (Chrome: Rendering panel → Emulate CSS media feature). Reload. Verify particles do not appear; the sentence fades in line.

Stop server.

- [ ] **Step 3: Checkpoint — Murmuration end-to-end working**

---

### Task 2.9: Phase 2 polish pass

- [ ] **Step 1: Run all tests**

```bash
pnpm test
```

Expected: all green.

- [ ] **Step 2: Run typecheck**

```bash
pnpm typecheck
```

Expected: no errors.

- [ ] **Step 3: Slow-motion review**

Open Chrome DevTools → Animations panel. Slow playback to 25%. Reload `http://localhost:3000`. Watch the murmuration animation frame by frame. Verify:
- [ ] Particles emerge from slightly above each word position (not from the word itself, not from off-screen)
- [ ] Particle paths feel naturally jittered, not in a visible pattern
- [ ] Words transition from `opacity: 0.1` through `0.45` to `1` smoothly, no stutter
- [ ] No layout shift as words resolve (the response area reserves its space from the start)
- [ ] Center-out order is perceptible but not too rigid
- [ ] Total duration on a 10-word response is between 1.2 and 1.6 seconds

If anything fails, retune `PER_WORD_RESOLVE_MS`, `STAGGER_MS`, or the particle jitter math in `murmuration.ts` / `murmuration-overlay.tsx`.

- [ ] **Step 4: Reduced-motion verification in Playwright**

`tests/e2e/reduced-motion-murmuration.spec.ts`:

```ts
import { expect, test } from '@playwright/test'

test('reduced motion mode resolves without particles', async ({ page, context }) => {
  await context.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  await page.waitForTimeout(400)
  const particles = page.locator('[data-mode="murmuration"] [aria-hidden="true"] > span').filter({ hasNot: page.locator('[data-state]') })
  await expect(particles).toHaveCount(0)
  const resolved = page.locator('[data-state="resolved"]')
  await expect(resolved.first()).toBeVisible()
})
```

Run:

```bash
pnpm test:e2e tests/e2e/reduced-motion-murmuration.spec.ts
```

Expected: PASS.

- [ ] **Step 5: Checkpoint — Phase 2 complete**

---

## Phase 3 — Mycelium, Fog, Aurora modes

### Task 3.1: Mycelium timeline + branch geometry

**Files:**
- Replace: `lib/diffusion/modes/mycelium.ts`
- Create: `lib/diffusion/modes/mycelium-branches.ts`
- Test: `tests/modes/mycelium.test.ts`

- [ ] **Step 1: Write failing test**

`tests/modes/mycelium.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { mycelium } from '@/lib/diffusion/modes/mycelium'
import { buildBranches } from '@/lib/diffusion/modes/mycelium-branches'

const measure = (count: number) =>
  Array.from({ length: count }, (_, i) => ({
    text: `w${i}`,
    index: i,
    lineIndex: Math.floor(i / 4),
    bbox: { x: (i % 4) * 60, y: Math.floor(i / 4) * 30, w: 50, h: 20 },
  }))

describe('mycelium', () => {
  it('total duration between 1500 and 2000ms', () => {
    const t = mycelium.totalDuration(measure(10))
    expect(t).toBeGreaterThanOrEqual(1500)
    expect(t).toBeLessThanOrEqual(2000)
  })

  it('emits resolving events that follow branch order from seeds outward', () => {
    const events = mycelium.computeTimeline(measure(8))
    const resolving = events.filter((e) => e.state === 'resolving')
    expect(resolving.length).toBe(8)
  })

  it('buildBranches returns at least 2 seed branches for 8+ words', () => {
    const branches = buildBranches(measure(8))
    expect(branches.length).toBeGreaterThanOrEqual(2)
    expect(branches.length).toBeLessThanOrEqual(3)
  })
})
```

- [ ] **Step 2: Run test, verify fail**

```bash
pnpm test tests/modes/mycelium.test.ts
```

Expected: FAIL.

- [ ] **Step 3: Implement branch geometry**

`lib/diffusion/modes/mycelium-branches.ts`:

```ts
import type { MeasuredAtom } from '../types'

export type Branch = {
  seedIndex: number
  seed: { x: number; y: number }
  segments: { from: { x: number; y: number }; to: { x: number; y: number }; wordIndex: number }[]
}

function pickSeeds(words: MeasuredAtom[]): number[] {
  if (words.length === 0) return []
  if (words.length <= 4) return [Math.floor(words.length / 2)]
  if (words.length <= 8) return [Math.floor(words.length / 4), Math.floor((3 * words.length) / 4)]
  return [
    Math.floor(words.length / 6),
    Math.floor(words.length / 2),
    Math.floor((5 * words.length) / 6),
  ]
}

export function buildBranches(words: MeasuredAtom[]): Branch[] {
  if (words.length === 0) return []
  const seeds = pickSeeds(words)
  const branches: Branch[] = []
  const assigned = new Set<number>()

  for (const seedIdx of seeds) {
    const seedWord = words[seedIdx]
    if (!seedWord) continue
    const seed = { x: seedWord.bbox.x + seedWord.bbox.w / 2, y: seedWord.bbox.y - 24 }
    const segments: Branch['segments'] = []
    const nearby = [...words]
      .filter((w) => !assigned.has(w.index))
      .sort((a, b) => {
        const da = Math.hypot(a.bbox.x - seedWord.bbox.x, a.bbox.y - seedWord.bbox.y)
        const db = Math.hypot(b.bbox.x - seedWord.bbox.x, b.bbox.y - seedWord.bbox.y)
        return da - db
      })
      .slice(0, Math.ceil(words.length / seeds.length))

    let from = seed
    for (const w of nearby) {
      const to = { x: w.bbox.x + w.bbox.w / 2, y: w.bbox.y + w.bbox.h / 2 }
      segments.push({ from, to, wordIndex: w.index })
      assigned.add(w.index)
      from = to
    }
    branches.push({ seedIndex: seedIdx, seed, segments })
  }
  return branches
}
```

- [ ] **Step 4: Implement strategy**

`lib/diffusion/modes/mycelium.ts`:

```ts
import type { ModeStrategy, MeasuredAtom, ResolutionEvent } from '../types'
import { standardReducedFallback } from '../reduced-motion'
import { buildBranches } from './mycelium-branches'
import { MyceliumOverlay } from '@/components/diffusion/mycelium-overlay'

const SEED_REVEAL_MS = 120
const BRANCH_GROW_PER_SEGMENT_MS = 90
const WORD_REVEAL_MS = 200
const BRANCH_FADE_OUT_MS = 400

function totalDuration(words: MeasuredAtom[]): number {
  if (words.length === 0) return 0
  const branches = buildBranches(words)
  const longest = Math.max(...branches.map((b) => b.segments.length), 0)
  return SEED_REVEAL_MS + longest * BRANCH_GROW_PER_SEGMENT_MS + WORD_REVEAL_MS + BRANCH_FADE_OUT_MS
}

function computeTimeline(words: MeasuredAtom[]): ResolutionEvent[] {
  if (words.length === 0) return []
  const branches = buildBranches(words)
  const events: ResolutionEvent[] = []
  for (const branch of branches) {
    branch.segments.forEach((seg, i) => {
      const t = SEED_REVEAL_MS + i * BRANCH_GROW_PER_SEGMENT_MS
      events.push({ wordIndex: seg.wordIndex, state: 'resolving', t })
      events.push({ wordIndex: seg.wordIndex, state: 'resolved', t: t + WORD_REVEAL_MS })
    })
  }
  return events
}

export const mycelium: ModeStrategy = {
  name: 'mycelium',
  totalDuration,
  computeTimeline,
  renderOverlay: (props) => MyceliumOverlay({ ...props, branches: buildBranches(props.words) }),
  reducedMotionFallback: standardReducedFallback,
}
```

- [ ] **Step 5: Run test, verify pass**

```bash
pnpm test tests/modes/mycelium.test.ts
```

Expected: PASS.

- [ ] **Step 6: Checkpoint — Mycelium logic shipped**

---

### Task 3.2: Mycelium SVG overlay

**Files:**
- Create: `components/diffusion/mycelium-overlay.tsx`

- [ ] **Step 1: Implement**

`components/diffusion/mycelium-overlay.tsx`:

```tsx
'use client'

import type { OverlayProps } from '@/lib/diffusion/types'
import type { Branch } from '@/lib/diffusion/modes/mycelium-branches'

type Props = OverlayProps & { branches: Branch[] }

export function MyceliumOverlay({ branches, progress, reduced }: Props) {
  if (reduced) return null
  if (branches.length === 0) return null

  return (
    <svg
      aria-hidden="true"
      className="absolute inset-0 pointer-events-none"
      style={{ width: '100%', height: '100%' }}
    >
      <defs>
        <filter id="myc-glow">
          <feGaussianBlur in="SourceGraphic" stdDeviation="0.8" />
        </filter>
      </defs>
      {branches.map((branch, bi) => (
        <g key={bi}>
          {branch.segments.map((seg, si) => {
            const lineProgress = Math.max(0, Math.min(1, progress * branch.segments.length - si))
            const length = Math.hypot(seg.to.x - seg.from.x, seg.to.y - seg.from.y)
            const visibleLength = length * lineProgress
            const tailFade = progress > 0.85 ? 1 - (progress - 0.85) / 0.15 : 1
            return (
              <line
                key={si}
                x1={seg.from.x}
                y1={seg.from.y}
                x2={seg.from.x + (seg.to.x - seg.from.x) * lineProgress}
                y2={seg.from.y + (seg.to.y - seg.from.y) * lineProgress}
                stroke="var(--accent)"
                strokeWidth={0.5}
                strokeLinecap="round"
                opacity={0.55 * tailFade}
              />
            )
          })}
          <circle
            cx={branch.seed.x}
            cy={branch.seed.y}
            r={progress > 0 ? 2 : 0}
            fill="var(--accent)"
            opacity={progress > 0.85 ? 1 - (progress - 0.85) / 0.15 : 1}
            style={{ filter: 'url(#myc-glow)' }}
          />
        </g>
      ))}
    </svg>
  )
}
```

- [ ] **Step 2: Run tests, verify still pass**

```bash
pnpm test
```

Expected: all green.

- [ ] **Step 3: Checkpoint — Mycelium overlay shipped**

---

### Task 3.3: Fog strategy + overlay

**Files:**
- Replace: `lib/diffusion/modes/fog.ts`
- Create: `components/diffusion/fog-overlay.tsx`
- Test: `tests/modes/fog.test.ts`

- [ ] **Step 1: Write failing test**

`tests/modes/fog.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { fog } from '@/lib/diffusion/modes/fog'

const measure = (count: number) =>
  Array.from({ length: count }, (_, i) => ({
    text: `w${i}`,
    index: i,
    lineIndex: Math.floor(i / 4),
    bbox: { x: (i % 4) * 60, y: Math.floor(i / 4) * 30, w: 50, h: 20 },
  }))

describe('fog', () => {
  it('total duration between 1400 and 1800ms', () => {
    const t = fog.totalDuration(measure(10))
    expect(t).toBeGreaterThanOrEqual(1400)
    expect(t).toBeLessThanOrEqual(1800)
  })

  it('resolves top-left words before bottom-right words', () => {
    const events = fog.computeTimeline(measure(8))
    const resolvedT = new Map<number, number>()
    for (const e of events) if (e.state === 'resolved') resolvedT.set(e.wordIndex, e.t)
    expect(resolvedT.get(0)!).toBeLessThan(resolvedT.get(7)!)
  })
})
```

- [ ] **Step 2: Run test, verify fail**

```bash
pnpm test tests/modes/fog.test.ts
```

Expected: FAIL.

- [ ] **Step 3: Implement strategy**

`lib/diffusion/modes/fog.ts`:

```ts
import type { ModeStrategy, MeasuredAtom, ResolutionEvent } from '../types'
import { standardReducedFallback } from '../reduced-motion'
import { FogOverlay } from '@/components/diffusion/fog-overlay'

const SWEEP_DURATION_MS = 1000
const PER_WORD_FOCUS_MS = 320

function spatialProgress(word: MeasuredAtom, all: MeasuredAtom[]): number {
  const xs = all.map((w) => w.bbox.x + w.bbox.w / 2)
  const ys = all.map((w) => w.bbox.y + w.bbox.h / 2)
  const minX = Math.min(...xs)
  const maxX = Math.max(...xs)
  const minY = Math.min(...ys)
  const maxY = Math.max(...ys)
  const wx = word.bbox.x + word.bbox.w / 2
  const wy = word.bbox.y + word.bbox.h / 2
  const nx = maxX === minX ? 0 : (wx - minX) / (maxX - minX)
  const ny = maxY === minY ? 0 : (wy - minY) / (maxY - minY)
  return (nx + ny) / 2
}

function totalDuration(words: MeasuredAtom[]): number {
  if (words.length === 0) return 0
  return SWEEP_DURATION_MS + PER_WORD_FOCUS_MS + 100
}

function computeTimeline(words: MeasuredAtom[]): ResolutionEvent[] {
  if (words.length === 0) return []
  const events: ResolutionEvent[] = []
  for (const w of words) {
    const p = spatialProgress(w, words)
    const start = p * SWEEP_DURATION_MS
    events.push({ wordIndex: w.index, state: 'resolving', t: start })
    events.push({ wordIndex: w.index, state: 'resolved', t: start + PER_WORD_FOCUS_MS })
  }
  events.sort((a, b) => a.t - b.t)
  return events
}

export const fog: ModeStrategy = {
  name: 'fog',
  totalDuration,
  computeTimeline,
  renderOverlay: (props) => FogOverlay(props),
  reducedMotionFallback: standardReducedFallback,
}
```

- [ ] **Step 4: Implement overlay**

`components/diffusion/fog-overlay.tsx`:

```tsx
'use client'

import type { OverlayProps } from '@/lib/diffusion/types'

export function FogOverlay({ progress, reduced }: OverlayProps) {
  if (reduced) return null
  const sweepOffset = -50 + progress * 150
  return (
    <div
      aria-hidden="true"
      className="absolute inset-0 pointer-events-none"
      style={{
        background: `linear-gradient(135deg,
          transparent 0%,
          transparent ${Math.max(0, sweepOffset - 10)}%,
          color-mix(in oklab, var(--stage-text) 10%, transparent) ${sweepOffset}%,
          color-mix(in oklab, var(--stage-text) 24%, transparent) ${sweepOffset + 8}%,
          color-mix(in oklab, var(--stage-text) 32%, transparent) ${sweepOffset + 20}%,
          color-mix(in oklab, var(--stage-text) 42%, transparent) 100%
        )`,
      }}
    />
  )
}
```

- [ ] **Step 5: Run test, verify pass**

```bash
pnpm test tests/modes/fog.test.ts
```

Expected: PASS.

- [ ] **Step 6: Checkpoint — Fog shipped**

---

### Task 3.4: Aurora strategy + overlay

**Files:**
- Replace: `lib/diffusion/modes/aurora.ts`
- Create: `components/diffusion/aurora-overlay.tsx`
- Test: `tests/modes/aurora.test.ts`

- [ ] **Step 1: Write failing test**

`tests/modes/aurora.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { aurora } from '@/lib/diffusion/modes/aurora'

const measure = (count: number) =>
  Array.from({ length: count }, (_, i) => ({
    text: `w${i}`,
    index: i,
    lineIndex: Math.floor(i / 4),
    bbox: { x: (i % 4) * 60, y: Math.floor(i / 4) * 30, w: 50, h: 20 },
  }))

describe('aurora', () => {
  it('total duration between 1200 and 1500ms', () => {
    const t = aurora.totalDuration(measure(12))
    expect(t).toBeGreaterThanOrEqual(1200)
    expect(t).toBeLessThanOrEqual(1500)
  })

  it('resolves line 0 words before line 1 words', () => {
    const events = aurora.computeTimeline(measure(8))
    const resolvedByLine = new Map<number, number[]>()
    for (const e of events) {
      if (e.state !== 'resolved') continue
      const w = measure(8).find((x) => x.index === e.wordIndex)!
      const arr = resolvedByLine.get(w.lineIndex) ?? []
      arr.push(e.t)
      resolvedByLine.set(w.lineIndex, arr)
    }
    const avgLine0 = average(resolvedByLine.get(0) ?? [])
    const avgLine1 = average(resolvedByLine.get(1) ?? [])
    expect(avgLine0).toBeLessThan(avgLine1)
  })
})

function average(xs: number[]): number {
  if (xs.length === 0) return 0
  return xs.reduce((s, x) => s + x, 0) / xs.length
}
```

- [ ] **Step 2: Run test, verify fail**

```bash
pnpm test tests/modes/aurora.test.ts
```

Expected: FAIL.

- [ ] **Step 3: Implement strategy**

`lib/diffusion/modes/aurora.ts`:

```ts
import type { ModeStrategy, MeasuredAtom, ResolutionEvent } from '../types'
import { standardReducedFallback } from '../reduced-motion'
import { AuroraOverlay } from '@/components/diffusion/aurora-overlay'

const BAND_SWEEP_MS = 900
const BAND_STAGGER_MS = 200
const WORD_ACTIVATE_MS = 180

function totalDuration(words: MeasuredAtom[]): number {
  if (words.length === 0) return 0
  const lines = new Set(words.map((w) => w.lineIndex)).size
  return (lines - 1) * BAND_STAGGER_MS + BAND_SWEEP_MS + WORD_ACTIVATE_MS
}

function computeTimeline(words: MeasuredAtom[]): ResolutionEvent[] {
  if (words.length === 0) return []
  const events: ResolutionEvent[] = []
  for (const w of words) {
    const lineStart = w.lineIndex * BAND_STAGGER_MS
    const xs = words.filter((x) => x.lineIndex === w.lineIndex).map((x) => x.bbox.x + x.bbox.w / 2)
    const minX = Math.min(...xs)
    const maxX = Math.max(...xs)
    const wx = w.bbox.x + w.bbox.w / 2
    const ratio = maxX === minX ? 0 : (wx - minX) / (maxX - minX)
    const t = lineStart + ratio * BAND_SWEEP_MS
    events.push({ wordIndex: w.index, state: 'resolving', t })
    events.push({ wordIndex: w.index, state: 'resolved', t: t + WORD_ACTIVATE_MS })
  }
  events.sort((a, b) => a.t - b.t)
  return events
}

export const aurora: ModeStrategy = {
  name: 'aurora',
  totalDuration,
  computeTimeline,
  renderOverlay: (props) => AuroraOverlay(props),
  reducedMotionFallback: standardReducedFallback,
}
```

- [ ] **Step 4: Implement overlay**

`components/diffusion/aurora-overlay.tsx`:

```tsx
'use client'

import { useMemo } from 'react'
import type { OverlayProps } from '@/lib/diffusion/types'

const BAND_STAGGER_RATIO = 0.18
const BAND_DURATION_RATIO = 0.82

export function AuroraOverlay({ words, progress, reduced }: OverlayProps) {
  if (reduced) return null

  const lines = useMemo(() => {
    const map = new Map<number, { y: number; h: number }>()
    for (const w of words) {
      const existing = map.get(w.lineIndex)
      if (!existing) map.set(w.lineIndex, { y: w.bbox.y, h: w.bbox.h })
    }
    return Array.from(map.entries()).sort((a, b) => a[0] - b[0])
  }, [words])

  return (
    <div aria-hidden="true" className="absolute inset-0 pointer-events-none overflow-hidden">
      {lines.map(([lineIdx, line]) => {
        const start = lineIdx * BAND_STAGGER_RATIO
        const local = Math.max(0, Math.min(1, (progress - start) / BAND_DURATION_RATIO))
        const x = -10 + local * 130
        return (
          <div
            key={lineIdx}
            style={{
              position: 'absolute',
              top: line.y - line.h * 0.4,
              left: 0,
              width: '100%',
              height: line.h * 1.8,
              transform: `translateX(${x}%)`,
              filter: 'blur(8px)',
              background: `linear-gradient(90deg,
                transparent 0%,
                color-mix(in oklab, var(--accent) 0%, transparent) 20%,
                color-mix(in oklab, var(--accent) 22%, transparent) 45%,
                color-mix(in oklab, var(--accent) 38%, transparent) 55%,
                color-mix(in oklab, var(--accent) 22%, transparent) 65%,
                transparent 85%
              )`,
              opacity: local > 0 && local < 1 ? 1 : 0,
            }}
          />
        )
      })}
    </div>
  )
}
```

- [ ] **Step 5: Run test, verify pass**

```bash
pnpm test tests/modes/aurora.test.ts
```

Expected: PASS.

- [ ] **Step 6: Checkpoint — Aurora shipped**

---

### Task 3.5: Phase 3 polish pass

- [ ] **Step 1: Wire all 4 modes into a demo page for visual review**

Replace `app/page.tsx`:

```tsx
'use client'

import { BrandProvider } from '@/lib/brand/provider'
import { Section } from '@/components/section'
import { DiffusionText } from '@/components/diffusion/diffusion-text'

const sample =
  'Speed. Diffusion resolves a full response in a single pass, parallel across all tokens, with no token-by-token serial dependency.'

const modes = ['murmuration', 'mycelium', 'fog', 'aurora'] as const

export default function HomePage() {
  return (
    <BrandProvider brand="after-tokens" as="main" className="min-h-screen">
      {modes.map((mode, i) => (
        <Section
          key={mode}
          id={`${mode}-demo`}
          n={i + 5}
          act="III"
          title={mode}
          eyebrow={['Phase 3', 'Mode prototype', mode]}
        >
          <h2 className="text-5xl font-bold tracking-tighter leading-none mb-8 capitalize">
            {mode}
          </h2>
          <div
            className="rounded-lg p-10"
            style={{ background: 'var(--stage)', color: 'var(--stage-text)' }}
          >
            <DiffusionText mode={mode} trigger="inView" className="text-xl leading-relaxed">
              {sample}
            </DiffusionText>
          </div>
        </Section>
      ))}
    </BrandProvider>
  )
}
```

- [ ] **Step 2: Run all tests**

```bash
pnpm test
```

Expected: all green.

- [ ] **Step 3: Slow-motion review of each mode**

Open Chrome DevTools → Animations → 25% speed. Scroll each mode into view. Verify per spec section 7:

Murmuration:
- [ ] Particles emerge from above word positions
- [ ] Center-out resolution order is perceptible
- [ ] Total duration ~1.2 to 1.6s for ~12 words

Mycelium:
- [ ] 2 to 3 seed dots appear first
- [ ] Branches grow with stroke-reveal
- [ ] Words materialize at branch endpoints
- [ ] Branches fade out after resolution
- [ ] Total duration ~1.5 to 2.0s

Fog:
- [ ] Diagonal sweep visible (top-left to bottom-right)
- [ ] Words come into focus as the sweep passes
- [ ] Continuous feel, no discrete word jumps
- [ ] Total duration ~1.4 to 1.8s

Aurora:
- [ ] Top line resolves first via a left-to-right band sweep
- [ ] Subsequent lines stagger 200ms behind
- [ ] Bands are luminous and clearly directional
- [ ] Total duration ~1.2 to 1.4s

Fix any mode that fails by tuning constants at the top of its strategy file.

- [ ] **Step 4: Reduced-motion verification**

DevTools → Rendering → Emulate `prefers-reduced-motion: reduce`. Reload. All four modes should resolve as a fade across the response in under 300ms total. No particles, no branches, no fog, no bands.

- [ ] **Step 5: Checkpoint — Phase 3 complete**

---

## Phase 4 — Editorial sections 01 to 04

### Task 4.1: Hero / section 01 (the hook)

**Files:**
- Create: `components/sections/section-01-hook.tsx`
- Create: `components/diffusion/broken-stream.tsx`
- Modify: `app/page.tsx`

- [ ] **Step 1: Implement the broken token-streaming component**

`components/diffusion/broken-stream.tsx`:

```tsx
'use client'

import { useEffect, useState } from 'react'

type Props = {
  text: string
  className?: string
  onBreak?: () => void
}

export function BrokenTokenStream({ text, className = '', onBreak }: Props) {
  const [revealed, setRevealed] = useState(0)
  const [broken, setBroken] = useState(false)

  useEffect(() => {
    const totalChars = text.length
    const breakAt = Math.floor(totalChars * 0.55)
    let i = 0
    const interval = setInterval(() => {
      i += 1
      setRevealed(i)
      if (i === breakAt) {
        setBroken(true)
        if (onBreak) onBreak()
      }
      if (i >= totalChars) clearInterval(interval)
    }, 35)
    return () => clearInterval(interval)
  }, [text, onBreak])

  return (
    <span
      className={className}
      style={{
        filter: broken ? 'blur(2px) hue-rotate(-10deg)' : 'none',
        transition: 'filter 220ms var(--ease-out-strong)',
      }}
    >
      {text.slice(0, revealed)}
      <span
        aria-hidden="true"
        style={{
          display: 'inline-block',
          width: '0.6ch',
          height: '1em',
          background: 'currentColor',
          marginLeft: '2px',
          animation: 'blink 600ms steps(1) infinite',
          verticalAlign: 'middle',
          opacity: broken ? 0.3 : 1,
        }}
      />
      <style>{`@keyframes blink { 50% { opacity: 0 } }`}</style>
    </span>
  )
}
```

- [ ] **Step 2: Implement the section**

`components/sections/section-01-hook.tsx`:

```tsx
'use client'

import { useState } from 'react'
import { Section } from '@/components/section'
import { BrokenTokenStream } from '@/components/diffusion/broken-stream'

const HEADLINE = 'Token-by-token is the only animation language we have. Until now.'

export function SectionHook() {
  const [phase, setPhase] = useState<'streaming' | 'broken' | 'static'>('streaming')

  return (
    <Section id="hook" n={1} act="I" title="Hook" eyebrow={['Section 01', 'Hook']}>
      <div className="min-h-[60vh] flex flex-col justify-center">
        {phase !== 'static' ? (
          <h1 className="text-5xl md:text-7xl font-bold tracking-tighter leading-[0.95]">
            <BrokenTokenStream
              text={HEADLINE}
              onBreak={() => {
                window.setTimeout(() => setPhase('static'), 1400)
              }}
            />
          </h1>
        ) : (
          <h1 className="text-5xl md:text-7xl font-bold tracking-tighter leading-[0.95]">
            <span>Token-by-token is the only animation language we have.</span>{' '}
            <span style={{ color: 'var(--accent)' }}>Until now.</span>
          </h1>
        )}
        <p className="mt-8 text-base text-[color:var(--ink-2)] max-w-prose">
          Diffusion text generation does not arrive one word at a time. The interface needs to know that too.
        </p>
      </div>
    </Section>
  )
}
```

- [ ] **Step 3: Wire into root page**

Replace `app/page.tsx`:

```tsx
import { BrandProvider } from '@/lib/brand/provider'
import { SectionHook } from '@/components/sections/section-01-hook'

export default function HomePage() {
  return (
    <BrandProvider brand="after-tokens" as="main" className="min-h-screen">
      <SectionHook />
    </BrandProvider>
  )
}
```

- [ ] **Step 4: Visual check**

```bash
pnpm dev
```

Reload `http://localhost:3000`. The headline should:
- Stream in token by token (left-to-right)
- Visibly break around 55% through (blur + slight hue shift)
- Cut to the static resolved version after ~1.4s
- The "Until now." phrase renders in cobalt accent on the static version

- [ ] **Step 5: Checkpoint — Section 01 shipped**

---

### Task 4.2: Section 02 — primer (fog)

**Files:**
- Create: `components/sections/section-02-primer.tsx`
- Modify: `app/page.tsx`

- [ ] **Step 1: Implement**

`components/sections/section-02-primer.tsx`:

```tsx
'use client'

import { Section } from '@/components/section'
import { DiffusionText } from '@/components/diffusion/diffusion-text'

export function SectionPrimer() {
  return (
    <Section id="primer" n={2} act="I" title="Primer" eyebrow={['Section 02', 'Primer', 'Fog']}>
      <h2 className="text-4xl md:text-5xl font-bold tracking-tighter leading-tight mb-10 max-w-3xl">
        Diffusion text generation, in sixty seconds.
      </h2>
      <div
        className="rounded-lg p-10 md:p-14"
        style={{ background: 'var(--stage)', color: 'var(--stage-text)' }}
      >
        <DiffusionText mode="fog" trigger="inView" className="text-lg md:text-xl leading-relaxed max-w-2xl">
          {`A diffusion model resolves a full response in a single pass. It starts from noise spread across the whole answer surface and refines toward clarity over multiple iterations. Tokens do not arrive sequentially. They arrive everywhere at once, with confidence building in parallel.`}
        </DiffusionText>
      </div>
    </Section>
  )
}
```

- [ ] **Step 2: Wire into root page**

Update `app/page.tsx`:

```tsx
import { BrandProvider } from '@/lib/brand/provider'
import { SectionHook } from '@/components/sections/section-01-hook'
import { SectionPrimer } from '@/components/sections/section-02-primer'

export default function HomePage() {
  return (
    <BrandProvider brand="after-tokens" as="main" className="min-h-screen">
      <SectionHook />
      <SectionPrimer />
    </BrandProvider>
  )
}
```

- [ ] **Step 3: Visual check**

Scroll past section 01 to trigger section 02. Verify the fog sweep across the response.

- [ ] **Step 4: Checkpoint — Section 02 shipped**

---

### Task 4.3: Section 03 — broken assumptions (murmuration)

**Files:**
- Create: `components/sections/section-03-assumptions.tsx`
- Modify: `app/page.tsx`

- [ ] **Step 1: Implement**

`components/sections/section-03-assumptions.tsx`:

```tsx
'use client'

import { Section } from '@/components/section'
import { DiffusionText } from '@/components/diffusion/diffusion-text'

const assumptions = [
  {
    title: 'The cursor sentinel',
    body: 'A blinking caret at the end of a partial line implies more text is coming, sequentially. Diffusion has no insertion point.',
  },
  {
    title: 'The growing message bubble',
    body: 'Bubble height tracks token count. Diffusion bubbles either pop into full size or grow non-monotonically as tokens resolve out of order.',
  },
  {
    title: 'The streaming-arrival mental model',
    body: 'Users learn to read partial outputs as trustable so far. Under diffusion, every token on screen is provisional until the final pass.',
  },
]

export function SectionAssumptions() {
  return (
    <Section
      id="assumptions"
      n={3}
      act="I"
      title="Broken assumptions"
      eyebrow={['Section 03', 'Broken assumptions', 'Murmuration']}
    >
      <h2 className="text-4xl md:text-5xl font-bold tracking-tighter leading-tight mb-12 max-w-3xl">
        Three chat conventions that quietly assume sequential tokens.
      </h2>
      <div className="flex flex-col gap-8">
        {assumptions.map((a, i) => (
          <div
            key={a.title}
            className="rounded-lg p-8 md:p-10"
            style={{ background: 'var(--stage)', color: 'var(--stage-text)' }}
          >
            <div
              className="text-xs uppercase tracking-[0.16em] mb-3"
              style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent)' }}
            >
              + 0{i + 1}
            </div>
            <h3 className="text-2xl font-semibold mb-4">{a.title}</h3>
            <DiffusionText mode="murmuration" trigger="inView" className="text-base leading-relaxed">
              {a.body}
            </DiffusionText>
          </div>
        ))}
      </div>
    </Section>
  )
}
```

- [ ] **Step 2: Wire**

Update `app/page.tsx` to add `<SectionAssumptions />` after `<SectionPrimer />`.

- [ ] **Step 3: Visual check**

Scroll through. Each of the three assumption cards should trigger its own murmuration animation as it enters view.

- [ ] **Step 4: Checkpoint — Section 03 shipped**

---

### Task 4.4: Section 04 — thesis (aurora)

**Files:**
- Create: `components/sections/section-04-thesis.tsx`
- Modify: `app/page.tsx`

- [ ] **Step 1: Implement**

`components/sections/section-04-thesis.tsx`:

```tsx
'use client'

import { Section } from '@/components/section'
import { DiffusionText } from '@/components/diffusion/diffusion-text'

export function SectionThesis() {
  return (
    <Section id="thesis" n={4} act="II" title="Thesis" eyebrow={['Section 04', 'Thesis', 'Aurora']}>
      <div className="min-h-[60vh] flex flex-col justify-center">
        <div
          className="rounded-lg p-12 md:p-16"
          style={{ background: 'var(--stage)', color: 'var(--stage-text)' }}
        >
          <div
            className="text-xs uppercase tracking-[0.16em] mb-4"
            style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent)' }}
          >
            + The argument
          </div>
          <DiffusionText
            mode="aurora"
            trigger="inView"
            className="text-3xl md:text-4xl font-bold tracking-tight leading-tight"
          >
            {`Animation should signal the shape of the answer. Diffusion gives the rendering moment back to the designer. Use it.`}
          </DiffusionText>
        </div>
      </div>
    </Section>
  )
}
```

- [ ] **Step 2: Wire and verify visually**

Update `app/page.tsx` to include `<SectionThesis />`. Reload and scroll to it. The aurora bands should sweep across the multi-line thesis statement.

- [ ] **Step 3: Checkpoint — Section 04 shipped**

---

### Task 4.5: Phase 4 polish pass

- [ ] **Step 1: Run all tests**

```bash
pnpm test
```

Expected: all green.

- [ ] **Step 2: Read the page top to bottom**

Open `http://localhost:3000`, scroll from top. Read every word aloud. Verify:
- [ ] Each section's mode reinforces its content (the medium serves the message)
- [ ] No content feels out of order or jarring
- [ ] No section reads as filler

- [ ] **Step 3: Mobile review**

DevTools → device emulation → iPhone 14. Reload. Verify every section renders without horizontal scroll, response areas wrap correctly, animations still run.

- [ ] **Step 4: Checkpoint — Phase 4 complete**

---

## Phase 5 — Brand variation system

### Task 5.1: Brand variation gallery section (section 09)

**Files:**
- Create: `components/sections/section-09-brand-variations.tsx`
- Modify: `app/page.tsx`

- [ ] **Step 1: Implement**

`components/sections/section-09-brand-variations.tsx`:

```tsx
'use client'

import { Section } from '@/components/section'
import { BrandProvider } from '@/lib/brand/provider'
import { DiffusionText } from '@/components/diffusion/diffusion-text'
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

export function SectionBrandVariations() {
  return (
    <Section
      id="brand-variations"
      n={9}
      act="IV"
      title="Brand variations"
      eyebrow={['Section 09', 'Same biology', 'Different species']}
    >
      <h2 className="text-4xl md:text-5xl font-bold tracking-tighter leading-tight mb-6 max-w-3xl">
        Same biology, different species.
      </h2>
      <p className="mb-12 text-base text-[color:var(--ink-2)] max-w-prose">
        Murmuration rendered across four brand identities. The animation behavior, timing, stagger, and tokenization are identical. Surface, ink, accent, and typography bend.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        {variants.map((v) => (
          <BrandProvider key={v.id} brand={v.id} className="rounded-xl overflow-hidden border" >
            <BrandTile prompt={v.prompt} response={v.response} industry={v.industry} />
          </BrandProvider>
        ))}
      </div>
    </Section>
  )
}

function BrandTile({ prompt, response, industry }: { prompt: string; response: string; industry: string }) {
  return (
    <div
      className="p-6 md:p-8 min-h-[280px] flex flex-col justify-between relative"
      style={{
        background: 'var(--surface)',
        color: 'var(--ink)',
        borderColor: 'color-mix(in oklab, var(--ink) 12%, transparent)',
        borderRadius: 'var(--brand-radius)',
      }}
    >
      <div className="flex justify-between items-start mb-6">
        <span style={{ fontFamily: 'var(--font-brand-display)', fontWeight: 700, fontSize: '14px' }}>
          {industry}
        </span>
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
      </div>
      <DiffusionText
        mode="murmuration"
        trigger="inView"
        className="text-xl md:text-2xl leading-snug"
      >
        {response}
      </DiffusionText>
    </div>
  )
}
```

- [ ] **Step 2: Wire**

Add `<SectionBrandVariations />` to `app/page.tsx` after section 04 (we'll fill 05-08 in a later phase if not already done; for now order doesn't matter for testing).

- [ ] **Step 3: Visual check across brands**

Reload. Scroll to brand variations. Verify each tile renders with:
- Halcyon: deep slate with bone serif text and sage particles
- Felt: terracotta surface with cream sans and cream particles
- Pulse: cool pale with slate text and aqua particles
- Voltage: true dark with mono text, faint grid background, tangerine particles

All four should animate simultaneously when the section enters view.

- [ ] **Step 4: Checkpoint — Section 09 shipped**

---

### Task 5.2: Sections 05 to 08 (the four mode tour)

**Files:**
- Create: `components/sections/section-05-murmuration.tsx`
- Create: `components/sections/section-06-mycelium.tsx`
- Create: `components/sections/section-07-fog.tsx`
- Create: `components/sections/section-08-aurora.tsx`
- Modify: `app/page.tsx`

- [ ] **Step 1: Implement the four sections**

Each section follows the same template, varying only mode + copy + accent moment. Create all four:

`components/sections/section-05-murmuration.tsx`:

```tsx
'use client'

import { Section } from '@/components/section'
import { DiffusionText } from '@/components/diffusion/diffusion-text'

export function SectionMurmuration() {
  return (
    <Section
      id="murmuration"
      n={5}
      act="III"
      title="Murmuration"
      eyebrow={['Section 05', 'Murmuration', 'Conversational']}
    >
      <h2 className="text-4xl md:text-5xl font-bold tracking-tighter leading-tight mb-4 max-w-3xl">
        Murmuration. The conversational default.
      </h2>
      <p className="mb-10 text-base text-[color:var(--ink-2)] max-w-prose">
        Tokens pre-exist as scattered particles above their eventual positions. They swarm into formation and collapse into ink. Reads as collective intelligence becoming visible.
      </p>
      <div
        className="rounded-lg p-10 md:p-14"
        style={{ background: 'var(--stage)', color: 'var(--stage-text)' }}
      >
        <DiffusionText mode="murmuration" trigger="inView" className="text-xl md:text-2xl leading-relaxed">
          {`I think the question you are really asking is about latency, not animation. Diffusion lets the model think in parallel. That is what makes it feel different to use.`}
        </DiffusionText>
      </div>
    </Section>
  )
}
```

`components/sections/section-06-mycelium.tsx`:

```tsx
'use client'

import { Section } from '@/components/section'
import { DiffusionText } from '@/components/diffusion/diffusion-text'

export function SectionMycelium() {
  return (
    <Section
      id="mycelium"
      n={6}
      act="III"
      title="Mycelium"
      eyebrow={['Section 06', 'Mycelium', 'Explanatory']}
    >
      <h2 className="text-4xl md:text-5xl font-bold tracking-tighter leading-tight mb-4 max-w-3xl">
        Mycelium. For walk-me-throughs and explain-this.
      </h2>
      <p className="mb-10 text-base text-[color:var(--ink-2)] max-w-prose">
        Seeds appear first, then branches grow to connect them, then words materialize at the endpoints. The animation models the shape of the explanation as it arrives.
      </p>
      <div
        className="rounded-lg p-10 md:p-14"
        style={{ background: 'var(--stage)', color: 'var(--stage-text)' }}
      >
        <DiffusionText mode="mycelium" trigger="inView" className="text-xl md:text-2xl leading-relaxed">
          {`Diffusion models denoise all tokens in parallel, refining over passes. Each pass increases confidence. The final output is the model's best estimate of the whole answer, not its best guess of the next word.`}
        </DiffusionText>
      </div>
    </Section>
  )
}
```

`components/sections/section-07-fog.tsx`:

```tsx
'use client'

import { Section } from '@/components/section'
import { DiffusionText } from '@/components/diffusion/diffusion-text'

export function SectionFog() {
  return (
    <Section id="fog" n={7} act="III" title="Fog" eyebrow={['Section 07', 'Fog', 'Creative']}>
      <h2 className="text-4xl md:text-5xl font-bold tracking-tighter leading-tight mb-4 max-w-3xl">
        Fog. For when the answer is discovered, not retrieved.
      </h2>
      <p className="mb-10 text-base text-[color:var(--ink-2)] max-w-prose">
        Text exists from frame one but at zero opacity behind a soft fog. A dissipation boundary sweeps diagonally. Words come into focus as the fog clears their cell. Atmospheric, slightly slower, intentionally.
      </p>
      <div
        className="rounded-lg p-10 md:p-14"
        style={{ background: 'var(--stage)', color: 'var(--stage-text)' }}
      >
        <DiffusionText mode="fog" trigger="inView" className="text-xl md:text-2xl leading-relaxed">
          {`A heron at dawn. Standing motionless in shallow water. The whole world holding its breath until it strikes.`}
        </DiffusionText>
      </div>
    </Section>
  )
}
```

`components/sections/section-08-aurora.tsx`:

```tsx
'use client'

import { Section } from '@/components/section'
import { DiffusionText } from '@/components/diffusion/diffusion-text'

export function SectionAurora() {
  return (
    <Section id="aurora" n={8} act="III" title="Aurora" eyebrow={['Section 08', 'Aurora', 'Summary']}>
      <h2 className="text-4xl md:text-5xl font-bold tracking-tighter leading-tight mb-4 max-w-3xl">
        Aurora. For the settled truth.
      </h2>
      <p className="mb-10 text-base text-[color:var(--ink-2)] max-w-prose">
        Luminous bands sweep across the lines. Each band activates a row of resolved tokens. Reads as "this is the final shape." Best for summaries, recaps, and distillations.
      </p>
      <div
        className="rounded-lg p-10 md:p-14"
        style={{ background: 'var(--stage)', color: 'var(--stage-text)' }}
      >
        <DiffusionText mode="aurora" trigger="inView" className="text-xl md:text-2xl leading-relaxed">
          {`Three years of model research, summarized. Parallelism beat depth. Diffusion caught up to autoregressive. The bottleneck moved from training data to the interface.`}
        </DiffusionText>
      </div>
    </Section>
  )
}
```

- [ ] **Step 2: Compose the full page in order**

Replace `app/page.tsx`:

```tsx
import { BrandProvider } from '@/lib/brand/provider'
import { SectionHook } from '@/components/sections/section-01-hook'
import { SectionPrimer } from '@/components/sections/section-02-primer'
import { SectionAssumptions } from '@/components/sections/section-03-assumptions'
import { SectionThesis } from '@/components/sections/section-04-thesis'
import { SectionMurmuration } from '@/components/sections/section-05-murmuration'
import { SectionMycelium } from '@/components/sections/section-06-mycelium'
import { SectionFog } from '@/components/sections/section-07-fog'
import { SectionAurora } from '@/components/sections/section-08-aurora'
import { SectionBrandVariations } from '@/components/sections/section-09-brand-variations'

export default function HomePage() {
  return (
    <BrandProvider brand="after-tokens" as="main" className="min-h-screen">
      <SectionHook />
      <SectionPrimer />
      <SectionAssumptions />
      <SectionThesis />
      <SectionMurmuration />
      <SectionMycelium />
      <SectionFog />
      <SectionAurora />
      <SectionBrandVariations />
    </BrandProvider>
  )
}
```

- [ ] **Step 3: Visual top-to-bottom review**

```bash
pnpm dev
```

Scroll from section 01 to 09. Verify:
- The page reads coherently
- Every section's mode renders correctly
- Layout is consistent
- No section feels out of place

- [ ] **Step 4: Checkpoint — Phase 5 complete**

---

## Phase 6 — Interactive coda (section 10)

### Task 6.1: Curated prompt fixtures

**Files:**
- Create: `lib/coda/fixtures.ts`
- Test: `tests/coda-fixtures.test.ts`

- [ ] **Step 1: Write failing test**

`tests/coda-fixtures.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { codaPrompts } from '@/lib/coda/fixtures'

describe('coda fixtures', () => {
  it('exposes exactly six prompts', () => {
    expect(codaPrompts).toHaveLength(6)
  })
  it('each prompt has a default mode and a response', () => {
    for (const p of codaPrompts) {
      expect(p.defaultMode).toMatch(/^(murmuration|mycelium|fog|aurora)$/)
      expect(p.response.length).toBeGreaterThan(20)
    }
  })
  it('covers all four modes', () => {
    const modes = new Set(codaPrompts.map((p) => p.defaultMode))
    expect(modes.size).toBe(4)
  })
})
```

- [ ] **Step 2: Run test, verify fail**

```bash
pnpm test tests/coda-fixtures.test.ts
```

Expected: FAIL.

- [ ] **Step 3: Implement**

`lib/coda/fixtures.ts`:

```ts
import type { ModeStrategy } from '@/lib/diffusion/types'

export type CodaPrompt = {
  id: string
  prompt: string
  defaultMode: ModeStrategy['name']
  response: string
}

export const codaPrompts: CodaPrompt[] = [
  {
    id: 'weather',
    prompt: "What's the weather like in metaphor land?",
    defaultMode: 'murmuration',
    response: 'Mild. A little fog this morning but the sun is supposed to break through by noon. Hold off on the umbrella.',
  },
  {
    id: 'diffusion-explain',
    prompt: 'Explain how diffusion text generation works.',
    defaultMode: 'mycelium',
    response: 'Diffusion models start with noise spread across the full response area. Each pass refines the noise into more confident tokens. After a fixed number of passes, the model commits to its best estimate of the whole answer at once.',
  },
  {
    id: 'research-summary',
    prompt: 'Summarize the last three years of model research.',
    defaultMode: 'aurora',
    response: 'Parallelism beat depth. Diffusion caught up to autoregressive on quality. Latency dropped by an order of magnitude. The interface became the bottleneck.',
  },
  {
    id: 'heron-poem',
    prompt: 'Write a poem about a heron at dawn.',
    defaultMode: 'fog',
    response: 'Long-legged thinker, knife held loose at the throat of the river. Patience is the only spell. The fish is already yours.',
  },
  {
    id: 'travel',
    prompt: 'Quick question. Should I take the train or fly?',
    defaultMode: 'murmuration',
    response: 'For under four hours of total travel, take the train. Door to door it usually wins, and you can actually work the whole way.',
  },
  {
    id: 'compiler-error',
    prompt: 'Walk me through this compiler error.',
    defaultMode: 'mycelium',
    response: 'The type system caught a mismatch between what the function returns and what the caller expects. Look at the return statement on line 14 and the variable type on line 22. They disagree.',
  },
]
```

- [ ] **Step 4: Run test, verify pass**

```bash
pnpm test tests/coda-fixtures.test.ts
```

Expected: PASS.

- [ ] **Step 5: Checkpoint — fixtures locked**

---

### Task 6.2: Coda stage component

**Files:**
- Create: `components/coda/coda-stage.tsx`

- [ ] **Step 1: Implement**

`components/coda/coda-stage.tsx`:

```tsx
'use client'

import { useEffect, useRef, useState } from 'react'
import { DiffusionText } from '@/components/diffusion/diffusion-text'
import type { CodaPrompt } from '@/lib/coda/fixtures'
import type { ModeStrategy } from '@/lib/diffusion/types'
import type { BrandTokens } from '@/lib/brand/types'

type Props = {
  prompt: CodaPrompt
  mode: ModeStrategy['name']
  brand: BrandTokens
  isAutoMode: boolean
}

export function CodaStage({ prompt, mode, brand, isAutoMode }: Props) {
  const [replayKey, setReplayKey] = useState(0)
  const replay = () => setReplayKey((k) => k + 1)

  return (
    <div
      className="relative rounded-lg overflow-hidden"
      style={{ background: 'var(--stage)', color: 'var(--stage-text)' }}
    >
      <div className="flex justify-between items-center px-6 pt-4 text-[10px] uppercase tracking-[0.16em]" style={{ fontFamily: 'var(--font-mono)' }}>
        <span style={{ color: 'color-mix(in oklab, var(--stage-text) 45%, transparent)' }}>Stage</span>
        <span style={{ color: 'var(--accent)' }}>+ {mode}{isAutoMode ? ' (auto)' : ''}</span>
        <span style={{ color: 'color-mix(in oklab, var(--stage-text) 70%, transparent)' }}>Brand · {brand.name}</span>
      </div>
      <div className="px-6 py-10 md:py-14 min-h-[180px] flex items-center">
        <DiffusionText
          key={`${prompt.id}-${mode}-${brand.id}-${replayKey}`}
          mode={mode}
          trigger="immediate"
          className="text-xl md:text-2xl leading-relaxed max-w-3xl"
        >
          {prompt.response}
        </DiffusionText>
      </div>
      <button
        type="button"
        onClick={replay}
        className="absolute bottom-3 right-6 text-[10px] uppercase tracking-[0.14em] cursor-pointer transition-opacity hover:opacity-100"
        style={{
          fontFamily: 'var(--font-mono)',
          color: 'color-mix(in oklab, var(--stage-text) 55%, transparent)',
        }}
      >
        + Replay
      </button>
    </div>
  )
}
```

- [ ] **Step 2: Checkpoint — stage component shipped**

---

### Task 6.3: Coda prompt picker

**Files:**
- Create: `components/coda/prompt-picker.tsx`

- [ ] **Step 1: Implement**

`components/coda/prompt-picker.tsx`:

```tsx
'use client'

import type { CodaPrompt } from '@/lib/coda/fixtures'

const modeAbbrev: Record<CodaPrompt['defaultMode'], string> = {
  murmuration: 'Conv',
  mycelium: 'Anlt',
  fog: 'Crtv',
  aurora: 'Smry',
}

type Props = {
  prompts: CodaPrompt[]
  activeId: string
  onSelect: (id: string) => void
}

export function PromptPicker({ prompts, activeId, onSelect }: Props) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
      {prompts.map((p) => {
        const isActive = p.id === activeId
        return (
          <button
            key={p.id}
            type="button"
            onClick={() => onSelect(p.id)}
            className="rounded-full px-4 py-2.5 text-left text-sm leading-snug cursor-pointer transition-all flex items-center gap-2"
            style={{
              border: '0.8px solid var(--ink)',
              background: isActive ? 'var(--ink)' : 'transparent',
              color: isActive ? 'var(--surface)' : 'var(--ink)',
            }}
          >
            <span
              className="shrink-0 text-[8.5px] uppercase tracking-[0.14em] opacity-60"
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              {modeAbbrev[p.defaultMode]}
            </span>
            <span>{p.prompt}</span>
          </button>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 2: Checkpoint — prompt picker shipped**

---

### Task 6.4: Coda mode + brand toggle rails

**Files:**
- Create: `components/coda/toggle-rail.tsx`

- [ ] **Step 1: Implement**

`components/coda/toggle-rail.tsx`:

```tsx
'use client'

type Item = { id: string; label: string; isAuto?: boolean }

type Props = {
  label: string
  items: Item[]
  activeId: string
  onSelect: (id: string) => void
}

export function ToggleRail({ label, items, activeId, onSelect }: Props) {
  return (
    <div className="grid grid-cols-[88px_1fr] gap-4 items-center">
      <span
        className="text-[9.5px] uppercase tracking-[0.16em]"
        style={{ fontFamily: 'var(--font-mono)', color: 'var(--muted)' }}
      >
        {label}
      </span>
      <div className="flex flex-wrap gap-1.5">
        {items.map((item) => {
          const isActive = item.id === activeId
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelect(item.id)}
              className="px-3.5 py-1.5 text-[11px] rounded-md cursor-pointer transition-all inline-flex items-center gap-1.5"
              style={{
                border: '0.8px solid var(--ink)',
                background: isActive ? 'var(--ink)' : 'transparent',
                color: isActive ? 'var(--surface)' : 'var(--ink)',
              }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{
                  background: isActive ? 'var(--accent)' : 'transparent',
                  border: isActive ? 'none' : '0.8px solid currentColor',
                  opacity: isActive ? 1 : 0.5,
                }}
              />
              {item.label}
              {item.isAuto && (
                <span
                  className="ml-1 text-[8.5px] uppercase tracking-[0.14em]"
                  style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent)' }}
                >
                  auto
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Checkpoint — toggle rail shipped**

---

### Task 6.5: Section 10 coda assembly

**Files:**
- Create: `components/sections/section-10-coda.tsx`
- Modify: `app/page.tsx`

- [ ] **Step 1: Implement**

`components/sections/section-10-coda.tsx`:

```tsx
'use client'

import { useEffect, useMemo, useState } from 'react'
import { Section } from '@/components/section'
import { BrandProvider } from '@/lib/brand/provider'
import { useBrand } from '@/lib/brand/provider'
import { getBrand } from '@/lib/brand/brands'
import { codaPrompts, type CodaPrompt } from '@/lib/coda/fixtures'
import { CodaStage } from '@/components/coda/coda-stage'
import { PromptPicker } from '@/components/coda/prompt-picker'
import { ToggleRail } from '@/components/coda/toggle-rail'
import type { BrandId } from '@/lib/brand/types'
import type { ModeStrategy } from '@/lib/diffusion/types'

const modes: ModeStrategy['name'][] = ['murmuration', 'mycelium', 'fog', 'aurora']
const brandIds: BrandId[] = ['after-tokens', 'halcyon', 'felt', 'pulse', 'voltage']

export function SectionCoda() {
  const [activePromptId, setActivePromptId] = useState(codaPrompts[1]!.id)
  const activePrompt = useMemo(() => codaPrompts.find((p) => p.id === activePromptId)!, [activePromptId])
  const [mode, setMode] = useState<ModeStrategy['name']>(activePrompt.defaultMode)
  const [brandId, setBrandId] = useState<BrandId>('after-tokens')
  const brand = useMemo(() => getBrand(brandId), [brandId])

  useEffect(() => {
    setMode(activePrompt.defaultMode)
  }, [activePrompt])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.code === 'Space') {
        const stageVisible = document.querySelector('#coda')?.getBoundingClientRect()
        if (stageVisible && stageVisible.top < window.innerHeight && stageVisible.bottom > 0) {
          e.preventDefault()
          setMode((m) => m)
          setActivePromptId((id) => id)
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <Section id="coda" n={10} act="IV" title="Interactive coda" eyebrow={['Section 10', 'Coda', 'Try the system']}>
      <h2 className="text-4xl md:text-5xl font-bold tracking-tighter leading-tight mb-4 max-w-3xl">
        Now you steer it.
      </h2>
      <p className="mb-10 text-base text-[color:var(--ink-2)] max-w-prose">
        Six prompts. Each maps to a mode by default. Override the mode or the brand to see how the same answer changes voice without changing mechanism.
      </p>

      <BrandProvider brand={brandId} className="rounded-2xl p-6 md:p-10 border" >
        <CodaScaffold prompt={activePrompt} mode={mode} />
      </BrandProvider>

      <div className="mt-8">
        <div className="text-[9.5px] uppercase tracking-[0.16em] mb-3" style={{ fontFamily: 'var(--font-mono)', color: 'var(--muted)' }}>
          + Pick a prompt
        </div>
        <PromptPicker prompts={codaPrompts} activeId={activePromptId} onSelect={setActivePromptId} />
      </div>

      <div className="mt-8 grid gap-4 pt-6 border-t" style={{ borderColor: 'color-mix(in oklab, var(--ink) 25%, transparent)' }}>
        <ToggleRail
          label="Mode"
          items={modes.map((m) => ({ id: m, label: cap(m), isAuto: m === activePrompt.defaultMode && m === mode }))}
          activeId={mode}
          onSelect={(id) => setMode(id as ModeStrategy['name'])}
        />
        <ToggleRail
          label="Brand"
          items={brandIds.map((b) => ({ id: b, label: getBrand(b).name }))}
          activeId={brandId}
          onSelect={(id) => setBrandId(id as BrandId)}
        />
      </div>
    </Section>
  )
}

function CodaScaffold({
  prompt,
  mode,
}: {
  prompt: CodaPrompt
  mode: ModeStrategy['name']
}) {
  const brand = useBrand()
  return (
    <div style={{ background: 'var(--surface)', borderRadius: 'var(--brand-radius)', padding: '24px' }}>
      <CodaStage prompt={prompt} mode={mode} brand={brand} isAutoMode={prompt.defaultMode === mode} />
    </div>
  )
}

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}
```

- [ ] **Step 2: Wire**

Update `app/page.tsx` to add `<SectionCoda />` after `<SectionBrandVariations />`.

- [ ] **Step 3: Visual interaction check**

Reload. Scroll to the coda. Verify:
- Six prompts visible; second one ("Explain how diffusion text generation works.") active by default
- Stage renders Mycelium animation (mode auto-selected based on prompt)
- Mode rail: Mycelium highlighted, "auto" tag visible
- Brand rail: "After tokens" active
- Click each prompt: stage replays with the new prompt's default mode
- Click a different mode: stage replays the same response in that mode
- Click a different brand: stage replays in the new brand's colors and typography (verify brand-tinted murmuration particles, brand-tinted fog/aurora, etc.)
- Replay button works

- [ ] **Step 4: Checkpoint — Section 10 shipped**

---

### Task 6.6: Phase 6 polish pass

- [ ] **Step 1: Run all tests + typecheck**

```bash
pnpm test && pnpm typecheck
```

Expected: all green.

- [ ] **Step 2: Keyboard navigation audit**

Tab through the coda. Verify:
- [ ] Every prompt chip is reachable
- [ ] Every mode/brand toggle is reachable
- [ ] Focus rings visible (cobalt, 2px, 1px offset) — if not, add `:focus-visible` styles to buttons
- [ ] Replay button is reachable

If any focus styles are missing, add this rule to `app/globals.css`:

```css
button:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 1px;
  border-radius: inherit;
}
```

- [ ] **Step 3: Checkpoint — Phase 6 complete**

---

## Phase 7 — Closing section, full polish, ship

### Task 7.1: Section 11 — close

**Files:**
- Create: `components/sections/section-11-close.tsx`
- Modify: `app/page.tsx`

- [ ] **Step 1: Implement**

`components/sections/section-11-close.tsx`:

```tsx
import { Section } from '@/components/section'

export function SectionClose() {
  return (
    <Section id="close" n={11} act="V" title="Close" eyebrow={['Section 11', 'Close', '2026']}>
      <div className="max-w-2xl">
        <h2 className="text-4xl md:text-5xl font-bold tracking-tighter leading-tight mb-8">
          What this case study does not solve.
        </h2>
        <ul className="space-y-4 text-base text-[color:var(--ink-2)] leading-relaxed mb-12">
          <li>
            <strong>Real-time classification.</strong> The coda's mode mapping is hard-coded per prompt.
            A production system would need an actual classifier, with all the failure modes that entails.
          </li>
          <li>
            <strong>Accessibility tradeoffs.</strong> Reduced motion collapses the animation language to
            a single fade. The function-mapping argument is lost. There may be a richer accessible version
            yet to be designed.
          </li>
          <li>
            <strong>Deep user testing.</strong> The thesis that "animation shape = answer shape" is intuitive
            but unvalidated at scale. The next step is research, not more design.
          </li>
        </ul>
        <div className="border-t pt-8" style={{ borderColor: 'color-mix(in oklab, var(--ink) 15%, transparent)' }}>
          <p
            className="text-[10px] uppercase tracking-[0.16em] mb-2"
            style={{ fontFamily: 'var(--font-mono)', color: 'var(--muted)' }}
          >
            + Credit
          </p>
          <p className="text-base">
            Designed and built by Chris Fiore. Portfolio theme: looking to nature for answers.
          </p>
        </div>
      </div>
    </Section>
  )
}
```

- [ ] **Step 2: Wire and visual check**

Add `<SectionClose />` to `app/page.tsx` at the end.

- [ ] **Step 3: Checkpoint — Section 11 shipped**

---

### Task 7.2: Reduced motion full audit

**Files:**
- Create: `tests/e2e/reduced-motion-full.spec.ts`

- [ ] **Step 1: Write Playwright spec**

`tests/e2e/reduced-motion-full.spec.ts`:

```ts
import { expect, test } from '@playwright/test'

test.describe('reduced motion full audit', () => {
  test.use({ contextOptions: { reducedMotion: 'reduce' } })

  test('all sections resolve their content without overlay animations', async ({ page }) => {
    await page.goto('/')
    const sectionIds = [
      'hook',
      'primer',
      'assumptions',
      'thesis',
      'murmuration',
      'mycelium',
      'fog',
      'aurora',
      'brand-variations',
      'coda',
      'close',
    ]
    for (const id of sectionIds) {
      await page.locator(`#${id}`).scrollIntoViewIfNeeded()
      await page.waitForTimeout(500)
      const resolvedWords = page.locator(`#${id} [data-state="resolved"]`)
      const count = await resolvedWords.count()
      if (id !== 'hook' && id !== 'close') {
        expect(count, `section ${id} should have resolved words`).toBeGreaterThan(0)
      }
    }
  })
})
```

- [ ] **Step 2: Run**

```bash
pnpm test:e2e tests/e2e/reduced-motion-full.spec.ts
```

Expected: PASS.

- [ ] **Step 3: Checkpoint — reduced motion verified end-to-end**

---

### Task 7.3: Performance audit

- [ ] **Step 1: Build the production bundle**

```bash
pnpm build
```

Expected: successful build. Note the route-by-route size table.

- [ ] **Step 2: Start production server and run Lighthouse**

```bash
pnpm start
```

In a new terminal:

```bash
npx lighthouse http://localhost:3000 --output=html --output-path=./lighthouse-report.html --chrome-flags="--headless"
```

- [ ] **Step 3: Verify targets**

Open `lighthouse-report.html`. Verify:
- [ ] Performance ≥ 95
- [ ] Accessibility ≥ 95
- [ ] Best Practices ≥ 95
- [ ] SEO ≥ 95
- [ ] LCP < 2.5s
- [ ] CLS < 0.1
- [ ] INP < 200ms

If any score is below target, investigate the audit's specific recommendations.

- [ ] **Step 4: Bundle size check**

In the production server's startup output, verify the First Load JS for `/` is under 220KB (after JS gzip + Next.js framework + our app code).

- [ ] **Step 5: Stop production server**

Stop both servers.

- [ ] **Step 6: Checkpoint — performance verified**

---

### Task 7.4: Accessibility audit

**Files:**
- Create: `tests/e2e/a11y.spec.ts`

- [ ] **Step 1: Install axe-core for Playwright**

```bash
pnpm add -D @axe-core/playwright
```

- [ ] **Step 2: Write axe spec**

`tests/e2e/a11y.spec.ts`:

```ts
import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

test('home page has no axe-core violations at WCAG 2.1 AA', async ({ page }) => {
  await page.goto('/')
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()
  expect(results.violations).toEqual([])
})
```

- [ ] **Step 3: Run**

```bash
pnpm test:e2e tests/e2e/a11y.spec.ts
```

Expected: PASS. If any violation, fix it before moving on.

- [ ] **Step 4: Manual screen reader pass**

Open VoiceOver (macOS: Cmd+F5) or NVDA. Navigate the page. Verify:
- [ ] The full text of every diffusion response is announced (the `aria-live` region carries it)
- [ ] Decorative crosshairs, particles, branches, fog, aurora bands are not announced (`aria-hidden`)
- [ ] Section landmarks are announced with their titles
- [ ] Coda controls (prompt chips, mode/brand toggles) are announced as buttons with their labels

- [ ] **Step 5: Checkpoint — accessibility verified**

---

### Task 7.5: Slow-motion craft review

- [ ] **Step 1: Chrome DevTools Animations panel, 25% speed**

Reload `http://localhost:3000`. Scroll section by section. For each animation moment, watch frame by frame. Apply the motion-discipline checklist:

- [ ] No `transform: scale(0)` anywhere — entries start from at least `scale(0.95)` (verify by reviewing component styles; the diffusion modes don't scale, so this is mainly a check on any other animated UI)
- [ ] Easing is custom ease-out for entries (we use `var(--ease-out-strong)` everywhere)
- [ ] No `transition: all` (search the codebase for `transition: all` — should return no results)
- [ ] Button `:active` states scale to `0.97` — verify on coda prompt chips and toggle buttons. If missing, add to `app/globals.css`:

```css
button { transition: transform 160ms var(--ease-out-strong); }
button:active { transform: scale(0.97); }
```

- [ ] No `transform-origin: center` on dropdowns/popovers (we don't ship popovers, so N/A)
- [ ] Color transitions blur briefly when crossfading (the diffusion overlays handle this naturally; if any solid color change feels stiff, add `filter: blur(2px)` during the transition)

- [ ] **Step 2: Search for forbidden patterns**

```bash
grep -rn "transition: all" --include="*.tsx" --include="*.ts" --include="*.css" .
grep -rn "addEventListener('scroll'" --include="*.tsx" --include="*.ts" .
grep -rn "scale(0)" --include="*.tsx" --include="*.ts" --include="*.css" .
```

Expected: no results from any of the three greps. If anything turns up, fix it.

- [ ] **Step 3: Cross-browser check**

Run Playwright across all three configured browsers:

```bash
pnpm test:e2e
```

Expected: all green in Chromium, WebKit, and mobile-portrait projects.

If WebKit has issues with `color-mix()` or `backdrop-filter`, add explicit fallbacks. Document any browser-specific quirks in `docs/browser-notes.md`.

- [ ] **Step 4: Checkpoint — craft review complete**

---

### Task 7.6: Production metadata, OG cards, favicon

**Files:**
- Modify: `app/layout.tsx`
- Create: `app/opengraph-image.tsx`, `public/favicon.ico`

- [ ] **Step 1: Update metadata**

Replace the `metadata` export in `app/layout.tsx`:

```tsx
export const metadata: Metadata = {
  title: 'After tokens. Designing AI text diffusion animations.',
  description:
    'A case study on UI animation language for AI text diffusion generation. Four nature-derived modes mapped to response types, bendable across brand identities.',
  openGraph: {
    title: 'After tokens.',
    description: 'A case study on UI animation language for AI text diffusion generation.',
    url: 'https://aftertokens.design',
    siteName: 'After tokens.',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'After tokens.',
    description: 'A case study on UI animation language for AI text diffusion generation.',
  },
  metadataBase: new URL('https://aftertokens.design'),
}
```

- [ ] **Step 2: Create OG image route**

`app/opengraph-image.tsx`:

```tsx
import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OG() {
  return new ImageResponse(
    (
      <div
        style={{
          background: '#EBE7DA',
          color: '#15140F',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          padding: '60px 80px',
          fontFamily: 'Inter',
        }}
      >
        <div style={{ fontSize: 18, color: '#6C685C', letterSpacing: '0.16em', textTransform: 'uppercase', marginBottom: 24 }}>
          Case study + 2026
        </div>
        <div style={{ fontSize: 140, fontWeight: 700, letterSpacing: '-0.04em', lineHeight: 0.95 }}>
          After<br />tokens.
        </div>
        <div style={{ fontSize: 28, color: '#2A2820', marginTop: 24, maxWidth: 800 }}>
          Designing animation language for AI text diffusion.
        </div>
      </div>
    ),
    size,
  )
}
```

- [ ] **Step 3: Generate favicon**

Use a small `+` registration mark as the favicon. Add to `app/icon.tsx`:

```tsx
import { ImageResponse } from 'next/og'

export const size = { width: 32, height: 32 }
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          background: '#EBE7DA',
          color: '#15140F',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 26,
          fontWeight: 400,
          fontFamily: 'monospace',
        }}
      >
        +
      </div>
    ),
    size,
  )
}
```

- [ ] **Step 4: Build and verify**

```bash
pnpm build && pnpm start
```

Navigate to `http://localhost:3000`. Verify favicon in tab. Visit `http://localhost:3000/opengraph-image` to verify OG renders.

- [ ] **Step 5: Checkpoint — metadata ready for deploy**

---

### Task 7.7: Final ship checklist

Run through everything. Each box must be checkable.

**Tests + types**
- [ ] `pnpm test` all green
- [ ] `pnpm typecheck` no errors
- [ ] `pnpm test:e2e` all green across Chromium, WebKit, mobile-portrait

**Performance**
- [ ] Lighthouse Performance ≥ 95
- [ ] Lighthouse Accessibility ≥ 95
- [ ] LCP < 2.5s, CLS < 0.1, INP < 200ms
- [ ] First Load JS < 220KB

**Accessibility**
- [ ] axe-core: no violations
- [ ] Screen reader pass: all responses announced, decorations silent
- [ ] Keyboard navigation: every interactive element reachable, focus rings visible
- [ ] Reduced motion: every section degrades to fade
- [ ] WCAG AA contrast: verified on all 5 brands' text-on-surface combinations

**Visual craft**
- [ ] Slow-motion review passed for all four modes
- [ ] No `transition: all`, no `scroll` event listeners, no `scale(0)` entries
- [ ] All buttons have `:active` press feedback
- [ ] All sections read coherently top-to-bottom
- [ ] Mobile portrait works without horizontal scroll

**Cross-browser**
- [ ] Chrome desktop: looks correct
- [ ] Safari desktop: looks correct (verify `color-mix` and `backdrop-filter` if used)
- [ ] Firefox desktop: looks correct
- [ ] Mobile Safari iOS: looks correct (manually on a real device if possible)
- [ ] Mobile Chrome Android: looks correct (manually on a real device if possible)

**Content**
- [ ] All copy proofread
- [ ] No em-dashes anywhere on the page (run `grep -rn "—" .` and `grep -rn "–" .` — both should return nothing from app files)
- [ ] No placeholder text
- [ ] Credits accurate
- [ ] OG image renders correctly
- [ ] Favicon visible

**Deploy**
- [ ] Domain decision made (vanity domain configured if going that path)
- [ ] Vercel project created
- [ ] Production deploy successful
- [ ] Production URL loads correctly
- [ ] Production Lighthouse re-run matches local

- [ ] **Final checkpoint — Phase 7 complete, ship ready**
