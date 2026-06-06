import type { Metadata } from 'next'
import { displayFont, monoFont } from '@/lib/fonts'
import { CursorFX } from '@/components/chrome/cursor-fx'
import './globals.css'

export const metadata: Metadata = {
  title: 'After tokens. Designing AI text diffusion animations.',
  description:
    'A case study on a UI animation language for diffusion language models, where text resolves all at once instead of token by token. Three nature-derived reveal modes (mycelium, fog, aurora) signal the shape of an answer so a person can read how settled it is, bendable across brand identities.',
  openGraph: {
    title: 'After tokens.',
    description: 'A case study on an animation language for diffusion language models: the reveal signals the shape of the answer.',
    url: 'https://aftertokens.design',
    siteName: 'After tokens.',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'After tokens.',
    description: 'A case study on an animation language for diffusion language models: the reveal signals the shape of the answer.',
  },
  metadataBase: new URL('https://aftertokens.design'),
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
