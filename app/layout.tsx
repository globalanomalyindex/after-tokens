import type { Metadata } from 'next'
import { displayFont, monoFont } from '@/lib/fonts'
import { CursorFX } from '@/components/chrome/cursor-fx'
import './globals.css'

// Icons are static files with an env-gated prefix rather than the app/icon.tsx
// convention: under `output: export` the convention route emits an href that
// ignores basePath, which 404s the favicon on the github pages mirror.
const iconBase = process.env.GITHUB_PAGES === 'true' ? '/after-tokens' : ''

export const metadata: Metadata = {
  icons: {
    icon: [{ url: `${iconBase}/icon.png`, type: 'image/png', sizes: '32x32' }],
    shortcut: `${iconBase}/favicon.ico`,
  },
  title: 'After tokens. Designing AI text diffusion animations.',
  description:
    'A case study on a UI animation language for diffusion language models, where text resolves all at once instead of token by token. Three nature-derived reveal modes (mycelium, fog, aurora) signal the shape of an answer so a person can read how settled it is, bendable across brand identities.',
  openGraph: {
    title: 'After tokens.',
    description: 'A case study on an animation language for diffusion language models: the reveal signals the shape of the answer.',
    url: 'https://after-tokens.vercel.app',
    siteName: 'After tokens.',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'After tokens.',
    description: 'A case study on an animation language for diffusion language models: the reveal signals the shape of the answer.',
  },
  metadataBase: new URL('https://after-tokens.vercel.app'),
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${displayFont.variable} ${monoFont.variable}`}>
      <body>
        {children}
        <CursorFX />
      </body>
    </html>
  )
}
