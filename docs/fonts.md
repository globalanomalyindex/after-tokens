# Fonts

Spec calls for **PP Neue Montreal** (display + body) and **Berkeley Mono** (mono labels).

## Status
- [ ] PP Neue Montreal license acquired and font files placed in `public/fonts/`
- [ ] Berkeley Mono license acquired and font files placed in `public/fonts/`

## Development fallback (ACTIVE)
Licensed fonts are **not yet acquired**. This build uses **Inter** (display + body) and **JetBrains Mono** (mono) via `next/font/google` as the development fallback. The visual character is close enough for development. Swap to real fonts before production launch.

## File layout (for licensed path, when fonts are acquired)
```
public/fonts/
  PPNeueMontreal-Bold.woff2
  PPNeueMontreal-Medium.woff2
  PPNeueMontreal-Regular.woff2
  BerkeleyMono-Regular.woff2
  BerkeleyMono-Medium.woff2
```

All files must be subset to the glyphs used by the page (basic Latin + punctuation + `+` symbol).
