export type WordAtom = {
  text: string
  index: number
  lineIndex: number
  /** gist-first hint in [0, 1], attached by DiffusionText (see lib/diffusion/salience.ts) */
  salience?: number
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
