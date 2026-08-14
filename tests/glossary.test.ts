// This suite exists because an earlier automated pass deleted lib/glossary.ts and the
// components that read from it (DefinitionTerm, cursor-fx), and nothing failed: no
// import broke, no type error surfaced, because the JSX call sites were deleted right
// alongside it. A silent, self-consistent deletion is the failure mode being defended
// against here. This test walks the source tree independently of the app's own imports,
// so a future deletion of the glossary (or of the terms that reference it) shows up as a
// failing assertion instead of a quiet regression.

import { readdirSync, readFileSync, statSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { GLOSSARY } from '@/lib/glossary'

const testDir = dirname(fileURLToPath(import.meta.url))
const repoRoot = join(testDir, '..')

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    const stats = statSync(full)
    if (stats.isDirectory()) {
      walk(full, out)
    } else if (entry.endsWith('.tsx')) {
      out.push(full)
    }
  }
  return out
}

function usedTerms(): { term: string; file: string }[] {
  const files = [...walk(join(repoRoot, 'components')), ...walk(join(repoRoot, 'app'))]
  const found: { term: string; file: string }[] = []
  const pattern = /<DefinitionTerm\s+term="([^"]+)"/g
  for (const file of files) {
    const text = readFileSync(file, 'utf-8')
    for (const match of text.matchAll(pattern)) {
      found.push({ term: match[1]!, file })
    }
  }
  return found
}

describe('glossary regression guard', () => {
  it('finds at least one DefinitionTerm usage in the source tree', () => {
    // Catches wholesale deletion of the glossary UI on its own: if every call site is
    // gone, this is the first assertion to fail.
    expect(usedTerms().length).toBeGreaterThan(0)
  })

  it('every DefinitionTerm usage references a term defined in GLOSSARY', () => {
    for (const { term, file } of usedTerms()) {
      expect(GLOSSARY[term], `"${term}" used in ${file} has no matching GLOSSARY entry`).toBeDefined()
    }
  })

  it('every GLOSSARY entry has complete, well-formed fields', () => {
    for (const [term, entry] of Object.entries(GLOSSARY)) {
      expect(entry.pron, `${term}: pron`).toBeTruthy()
      expect(entry.pos, `${term}: pos`).toBeTruthy()
      expect(entry.def, `${term}: def`).toBeTruthy()
      expect(entry.src, `${term}: src`).toBeTruthy()
      expect(entry.color, `${term}: color`).toMatch(/^oklch\(/)
    }
  })

  it('every def and src opens lowercase, matching the editorial voice', () => {
    for (const [term, entry] of Object.entries(GLOSSARY)) {
      expect(entry.def[0], `${term}: def "${entry.def}" starts uppercase`).not.toMatch(/[A-Z]/)
      expect(entry.src[0], `${term}: src "${entry.src}" starts uppercase`).not.toMatch(/[A-Z]/)
    }
  })

  it('no def or src contains an em dash or a double hyphen', () => {
    for (const [term, entry] of Object.entries(GLOSSARY)) {
      expect(entry.def, `${term}: def`).not.toMatch(/—|--/)
      expect(entry.src, `${term}: src`).not.toMatch(/—|--/)
    }
  })
})
