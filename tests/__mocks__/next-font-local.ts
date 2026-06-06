// Mock for next/font/local in Vitest jsdom environment
export default function localFont(options: { variable: string; src: unknown[] }) {
  return {
    variable: options.variable,
    className: options.variable.replace('--font-', 'font-'),
    style: { fontFamily: options.variable },
  }
}
