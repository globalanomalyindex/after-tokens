type FontOptions = { variable?: string }
type FontResult = { variable: string; className: string; style: { fontFamily: string } }

function mockFont(name: string) {
  return (opts: FontOptions = {}): FontResult => ({
    variable: opts.variable ?? `--font-${name}`,
    className: `font-${name}`,
    style: { fontFamily: name },
  })
}

export const JetBrains_Mono = mockFont('jetbrains-mono')
export const Instrument_Sans = mockFont('instrument-sans')
export const Inter = mockFont('inter')
