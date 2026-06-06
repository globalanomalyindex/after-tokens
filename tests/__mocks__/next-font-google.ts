// Mock for next/font/google in Vitest jsdom environment
function mockFont(variable: string) {
  return () => ({
    variable,
    className: variable.replace('--font-', 'font-'),
    style: { fontFamily: variable },
  })
}

export const Inter = mockFont('--font-display')
export const JetBrains_Mono = mockFont('--font-mono')
export const PP_Neue_Montreal = mockFont('--font-display')
export const Berkeley_Mono = mockFont('--font-mono')
