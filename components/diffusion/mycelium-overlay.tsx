'use client'

import type { OverlayProps } from '@/lib/diffusion/types'

// Mycelium mode no longer paints an overlay. The lock signal lives on the
// word itself: locked words become heavier, sit inside a soft accent halo
// that breathes, and the completion sweep + rim glow handle the final beat.
// See globals.css for the per-word treatment.
//
// We still accept OverlayProps so the strategy's renderOverlay contract
// stays unchanged — props are just unused here.
export function MyceliumOverlay(_props: OverlayProps) {
  void _props
  return null
}
